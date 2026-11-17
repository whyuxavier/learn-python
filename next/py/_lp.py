"""Запуск коду учня: введення/виведення, контроль циклів, помилки українською."""
import builtins
import json
import os
import re
import sys
import time

import _lpbridge as B

WORKDIR = '/home/pyodide/work'
USER = set()          # шляхи файлів учня
_n = [0]
_real_sleep = time.sleep


class _Out:
    encoding = 'utf-8'
    errors = 'strict'

    def __init__(self, kind):
        self.kind = kind

    def write(self, s):
        if s:
            B.out(s, self.kind)
        return len(s)

    def writelines(self, lines):
        for x in lines:
            self.write(x)

    def flush(self):
        pass

    def isatty(self):
        return False


def _input(prompt=''):
    p = str(prompt)
    B.flush()
    if B.can_sync():
        line = B.wait(B.api.readLine(p))
    else:
        line = B.api.prompt(p)
    if B.api.stopped():
        raise KeyboardInterrupt
    if line is None or not isinstance(line, str):
        line = ''
    B.api.echo(p, line)
    return line


def _sleep(sec):
    B.flush()
    try:
        sec = float(sec)
    except (TypeError, ValueError):
        return _real_sleep(sec)
    if B.can_sync():
        B.wait(B.api.sleep(max(0, int(sec * 1000))))
        B._last_yield[0] = time.time()
        if B.api.stopped():
            raise KeyboardInterrupt
    elif B.in_main and sec > 0:
        # без підтримки JSPI пауза лише імітується
        B.fake_sleep = True
        B.fake_total = getattr(B, 'fake_total', 0) + sec
        if B.fake_total > 15:
            raise B.LPTimeout()
        if B.deadline is not None:
            B.deadline += sec


def _trace(frame, event, arg):
    if frame.f_code.co_filename in USER:
        return _local
    return None


def _local(frame, event, arg):
    if event == 'line':
        _n[0] += 1
        if _n[0] >= 300:
            _n[0] = 0
            B.check()
    return _local


def run(payload):
    p = json.loads(str(payload))
    files = p['files']
    main = p.get('main') or files[0][0]
    workdir = p.get('workdir') or WORKDIR
    B.reset()
    os.makedirs(workdir, exist_ok=True)
    USER.clear()
    for name in os.listdir(workdir):
        if name.endswith('.py'):
            try:
                os.remove(os.path.join(workdir, name))
            except OSError:
                pass
    code = ''
    for name, src in files:
        path = os.path.join(workdir, name)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        USER.add(path)
        mod = name[:-3] if name.endswith('.py') else name
        sys.modules.pop(mod, None)
        if name == main:
            code = src
    USER.add(main)
    if workdir in sys.path:
        sys.path.remove(workdir)
    sys.path.insert(0, workdir)
    try:
        os.chdir(workdir)
    except OSError:
        pass
    sys.stdout = _Out('out')
    sys.stderr = _Out('err')
    builtins.input = _input
    time.sleep = _sleep
    B.report = report
    B.in_main = True
    B._last_yield[0] = time.time()
    B.deadline = None if (B._run_sync and B.can_sync()) else time.time() + 12
    g = {'__name__': '__main__', '__builtins__': builtins, '__file__': main}
    ok = True
    sys.settrace(_trace)
    try:
        c = compile(code, main, 'exec')
        exec(c, g)
    except SystemExit:
        pass
    except BaseException as e:
        ok = False
        report(e)
    finally:
        B.in_main = False
        B.deadline = None
        B.flush()
    return ok


# ---------- помилки українською ----------
def _q(s):
    return '«%s»' % s


def _types(t):
    return {'str': 'str (рядок)', 'int': 'int (ціле число)', 'float': 'float (дробове число)',
            'list': 'list (список)', 'NoneType': 'None', 'dict': 'dict (словник)',
            'bool': 'bool', 'tuple': 'tuple (кортеж)'}.get(t, t)


def explain(e):
    """Повертає (заголовок, підказка)."""
    name = type(e).__name__
    msg = str(e.msg) if isinstance(e, SyntaxError) else str(e)
    m = re.search(r"Did you mean: '([^']+)'\?", msg)
    mean = ('Можливо, мало бути %s?' % _q(m.group(1))) if m else ''
    if isinstance(e, B.LPTimeout) and getattr(B, 'fake_sleep', False):
        return 'Цей браузер не показує анімацію в циклі while з sleep()', 'Відкрий курс у Chrome або Edge чи заміни цикл на функцію з root.after(20, функція).'
    if isinstance(e, B.LPTimeout):
        return 'Програма виконується надто довго', 'Можливо, цикл while ніколи не завершується. Перевір умову циклу.'
    if isinstance(e, KeyboardInterrupt):
        return 'Програму зупинено', ''
    if isinstance(e, B.ColorError):
        return 'Невідомий колір: ' + msg.split('"')[1] if '"' in msg else msg, 'Використай англійську назву кольору (red, lightblue) або код #rrggbb.'
    if isinstance(e, IndentationError) or isinstance(e, TabError):
        if 'unexpected indent' in msg:
            return 'Зайвий відступ', 'Цей рядок не має починатися з пробілів.'
        if 'expected an indented block' in msg:
            return 'Потрібен відступ', 'Після рядка з двокрапкою «:» вкладені команди пишуть з відступом у 4 пробіли.'
        if 'unindent does not match' in msg:
            return 'Відступ не збігається', 'Відступи в одному блоці мають бути однаковими (по 4 пробіли).'
        if isinstance(e, TabError):
            return 'Змішано табуляцію і пробіли', 'Використовуй лише пробіли для відступів.'
        return 'Помилка відступів', ''
    if isinstance(e, SyntaxError):
        if "expected ':'" in msg:
            return 'Пропущено двокрапку «:»', 'Рядки з if, elif, else, for, while, def закінчуються двокрапкою.'
        m2 = re.search(r"'(.)' was never closed", msg)
        if m2:
            return 'Дужку %s не закрито' % _q(m2.group(1)), 'Перевір, чи кожна дужка має пару.'
        m2 = re.search(r"unmatched '(.)'", msg)
        if m2:
            return 'Зайва дужка %s' % _q(m2.group(1)), ''
        m2 = re.search(r"closing parenthesis '(.)' does not match opening parenthesis '(.)'", msg)
        if m2:
            return 'Дужки не збігаються', 'Закривна %s не відповідає відкривній %s.' % (_q(m2.group(1)), _q(m2.group(2)))
        if 'unterminated string' in msg or 'EOL while scanning' in msg:
            return 'Рядок не закрито лапками', 'Текст має бути в лапках з обох боків: "текст".'
        if 'unterminated triple-quoted' in msg:
            return 'Не закрито потрійні лапки', ''
        if 'Perhaps you forgot a comma' in msg:
            return 'Синтаксична помилка', 'Можливо, пропущено кому між значеннями.'
        if "Maybe you meant '==' " in msg or "Maybe you meant '=='" in msg:
            return 'Помилка в умові', 'Для порівняння використовуй «==», а не «=».'
        if 'Missing parentheses' in msg:
            return 'Пропущено дужки', 'У Python 3 після print потрібні дужки: print("текст").'
        m2 = re.search(r"invalid character '(.)'", msg)
        if m2:
            return 'Недопустимий символ %s' % _q(m2.group(1)), 'Можливо, це кирилична літера, «розумні» лапки чи тире. Набери символ англійською розкладкою.'
        if 'invalid decimal literal' in msg:
            return 'Неправильне число або назва', 'Назва змінної не може починатися з цифри.'
        if 'cannot assign to' in msg:
            return 'Неможливе присвоєння', 'Ліворуч від «=» має бути назва змінної.'
        if "'return' outside function" in msg:
            return 'return поза функцією', 'return можна використовувати лише всередині def.'
        if "'break' outside loop" in msg or "'continue' not properly in loop" in msg:
            return 'break/continue поза циклом', ''
        if 'unexpected EOF' in msg or "expected 'else'" in msg:
            return 'Код обірвано', 'Перевір останні рядки: можливо, щось не дописано.'
        if 'invalid syntax' in msg:
            return 'Синтаксична помилка', 'Python не може зрозуміти цей рядок. Перевір дужки, лапки, коми й двокрапки.'
        return 'Синтаксична помилка', ''
    if isinstance(e, UnboundLocalError):
        m2 = re.search(r"'([^']+)'", msg)
        v = m2.group(1) if m2 else ''
        return 'Змінну %s використано до присвоєння' % _q(v), 'Якщо змінна створена поза функцією, а ти змінюєш її всередині, додай рядок: global %s' % v
    if isinstance(e, NameError):
        m2 = re.search(r"name '([^']+)' is not defined", msg)
        v = m2.group(1) if m2 else ''
        hint = mean or 'Таку змінну чи функцію не створено. Перевір написання і великі/малі літери.'
        if v.lower() in ('true', 'false', 'none') and not mean:
            hint = 'Пиши з великої літери: True, False, None.'
        return 'Невідома назва %s' % _q(v), hint
    if isinstance(e, ZeroDivisionError):
        return 'Ділення на нуль', 'Перед діленням перевір, що дільник не дорівнює 0.'
    if isinstance(e, RecursionError):
        return 'Забагато рекурсивних викликів', 'Перевір умову зупинки рекурсії (базовий випадок).'
    if isinstance(e, ModuleNotFoundError):
        m2 = re.search(r"No module named '([^']+)'", msg)
        v = m2.group(1) if m2 else ''
        if v.split('.')[0] in ('pgzrun', 'pgzero', 'pygame'):
            return 'Pygame Zero не працює в браузері', 'Скопіюй код і запусти його в Thonny або VS Code.'
        return 'Модуль %s не знайдено' % _q(v), 'Перевір назву модуля або файлу.'
    if isinstance(e, ImportError):
        return 'Помилка імпорту', 'Перевір, що функція з такою назвою є в модулі.'
    if isinstance(e, IndexError):
        if 'pop from empty' in msg:
            return 'Список порожній', 'З порожнього списку не можна взяти елемент.'
        if 'string' in msg:
            return 'Індекс виходить за межі рядка', 'Індекси рядка: від 0 до len(рядок) - 1.'
        return 'Індекс виходить за межі списку', 'Індекси списку: від 0 до len(список) - 1.'
    if isinstance(e, KeyError):
        return 'У словнику немає ключа %s' % _q(msg.strip("'\"")), 'Перевір ключ або використай .get(ключ).'
    if isinstance(e, ValueError):
        m2 = re.search(r"invalid literal for int\(\) with base 10: '(.*)'", msg)
        if m2:
            return 'Не вдалося перетворити %s на ціле число' % _q(m2.group(1)), 'int() перетворює лише рядки з цифрами, наприклад "15".'
        m2 = re.search(r"could not convert string to float: '(.*)'", msg)
        if m2:
            return 'Не вдалося перетворити %s на число' % _q(m2.group(1)), 'Дробові числа пишуть через крапку: 3.5'
        if 'not in list' in msg:
            return 'Такого елемента немає у списку', 'Перевір наявність: if x in список:'
        if 'too many values to unpack' in msg or 'not enough values to unpack' in msg:
            return 'Кількість змінних не збігається з кількістю значень', ''
        if 'empty' in msg and ('max' in msg or 'min' in msg):
            return 'Порожня послідовність', 'max() і min() не працюють з порожнім списком.'
        return 'Неправильне значення', ''
    if isinstance(e, TypeError):
        m2 = re.search(r'can only concatenate str \(not "([^"]+)"\) to str', msg)
        if m2:
            return 'Не можна додати %s до рядка' % _types(m2.group(1)), 'Перетвори число на рядок: str(x), або використай f-рядок.'
        m2 = re.search(r"unsupported operand type\(s\) for ([^:]+): '([^']+)' and '([^']+)'", msg)
        if m2:
            hint = ''
            if 'str' in (m2.group(2), m2.group(3)):
                hint = 'input() повертає рядок. Для обчислень перетвори його: int(input()).'
            return 'Операцію %s не можна виконати для %s і %s' % (m2.group(1).strip(), _types(m2.group(2)), _types(m2.group(3))), hint
        m2 = re.search(r"'([^']+)' not supported between instances of '([^']+)' and '([^']+)'", msg)
        if m2:
            return 'Не можна порівняти %s і %s' % (_types(m2.group(2)), _types(m2.group(3))), 'Перетвори значення до одного типу, наприклад int(...).'
        m2 = re.search(r"'([^']+)' object is not callable", msg)
        if m2:
            return 'Об\'єкт типу %s не можна викликати' % _types(m2.group(1)), 'Можливо, зайві дужки () або назва змінної збігається з назвою функції.'
        m2 = re.search(r"'([^']+)' object is not subscriptable", msg)
        if m2:
            return 'Квадратні дужки не працюють для %s' % _types(m2.group(1)), ''
        m2 = re.search(r"'([^']+)' object is not iterable", msg)
        if m2:
            return 'Об\'єкт %s не можна перебрати в циклі' % _types(m2.group(1)), 'Для повторень використай range(n).'
        if 'indices must be integers' in msg:
            return 'Індекс має бути цілим числом', 'Перетвори індекс: int(...).'
        m2 = re.search(r"missing (\d+) required positional argument", msg)
        if m2:
            return 'Функції бракує аргументів', msg.split(':')[-1].strip() and 'Бракує: ' + msg.split(':')[-1].strip()
        if 'positional argument' in msg and 'given' in msg:
            return 'Неправильна кількість аргументів', 'Перевір, скільки значень передаєш у функцію.'
        if 'unexpected keyword argument' in msg:
            m3 = re.search(r"argument '([^']+)'", msg)
            return 'Невідомий параметр %s' % _q(m3.group(1) if m3 else ''), 'Перевір назву параметра.'
        return 'Помилка типів даних', ''
    if isinstance(e, AttributeError):
        m2 = re.search(r"'([^']+)' object has no attribute '([^']+)'", msg)
        if m2:
            return 'У %s немає %s' % (_types(m2.group(1)), _q(m2.group(2))), mean or 'Перевір назву методу чи властивості.'
        m2 = re.search(r"module '([^']+)' has no attribute '([^']+)'", msg)
        if m2:
            return 'У модулі %s немає %s' % (_q(m2.group(1)), _q(m2.group(2))), mean or 'Перевір назву.'
        return 'Невідомий атрибут', mean
    if isinstance(e, AssertionError):
        return 'Перевірку assert не пройдено', msg
    if isinstance(e, FileNotFoundError):
        return 'Файл не знайдено', ''
    if isinstance(e, OverflowError):
        return 'Занадто велике число', ''
    if isinstance(e, MemoryError):
        return 'Забракло пам\'яті', ''
    if name == 'TclError':
        return 'Помилка tkinter', msg
    return 'Помилка під час виконання', ''


def report(e):
    try:
        B.flush()
    except Exception:
        pass
    fname, line = None, None
    if isinstance(e, SyntaxError) and e.filename and (e.filename in USER or e.filename == 'main.py'):
        fname, line = e.filename, e.lineno
    else:
        tb = e.__traceback__
        while tb is not None:
            fn = tb.tb_frame.f_code.co_filename
            if fn in USER:
                fname, line = fn, tb.tb_lineno
            tb = tb.tb_next
    if fname:
        fname = os.path.basename(fname)
    try:
        title, hint = explain(e)
    except Exception:
        title, hint = 'Помилка', ''
    if isinstance(e, (KeyboardInterrupt, B.LPTimeout)):
        raw = ''
    elif isinstance(e, SyntaxError):
        raw = '%s: %s' % (type(e).__name__, e.msg)
    else:
        raw = '%s: %s' % (type(e).__name__, e)
    B.api.error(json.dumps({'file': fname, 'line': line, 'title': title, 'hint': hint or '', 'raw': raw,
                            'stop': isinstance(e, KeyboardInterrupt)}, ensure_ascii=False))
