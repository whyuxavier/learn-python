"""Міст між Python (Pyodide) і сторінкою курсу. Службовий модуль."""
import json
import time

api = None            # JS-об'єкт LP (або заглушка в тестах)
_run_sync = None
_can_run_sync = None
_q = []
_hooks = []           # функції перед відправленням команд (буфер turtle)
_handlers = {}
_reset_hooks = []
_timers = {}
_tid = [0]
in_main = False
deadline = None
_last_yield = [0.0]
report = None         # функція звіту про помилку (з _lp)


class LPTimeout(Exception):
    pass


def init(js_api, run_sync=None, can_run_sync=None):
    global api, _run_sync, _can_run_sync
    api = js_api
    _run_sync = run_sync
    _can_run_sync = can_run_sync
    if _run_sync is None:
        try:
            from pyodide.ffi import run_sync as rs, can_run_sync as crs
            _run_sync, _can_run_sync = rs, crs
        except Exception:
            pass
    api.setDispatcher(_make_proxy(dispatch))


def _make_proxy(f):
    try:
        from pyodide.ffi import create_proxy
        return create_proxy(f)
    except Exception:
        return f


def can_sync():
    if not in_main or _run_sync is None or _can_run_sync is None:
        return False
    try:
        return bool(_can_run_sync())
    except Exception:
        return False


def wait(promise):
    return _run_sync(promise)


# ---------- команди ----------
def send(op, **kw):
    kw['op'] = op
    _q.append(kw)


def add_hook(f):
    if f not in _hooks:
        _hooks.append(f)


def flush():
    for h in _hooks:
        h()
    if _q:
        data = json.dumps(_q, ensure_ascii=False, default=str)
        _q.clear()
        api.cmd(data)


def out(text, kind='out'):
    flush()
    api.out(str(text), kind)


# ---------- події ----------
def on(name, fn):
    _handlers[name] = fn


def on_reset(fn):
    _reset_hooks.append(fn)


def reset():
    global fake_sleep, fake_total
    fake_sleep = False
    fake_total = 0
    _q.clear()
    _timers.clear()
    for f in _reset_hooks:
        try:
            f()
        except Exception:
            pass
    _q.clear()


def handle(ev):
    h = _handlers.get(ev.get('ev'))
    if h:
        h(ev)


def dispatch(s):
    global deadline
    deadline = time.time() + 6
    try:
        handle(json.loads(str(s)))
    except SystemExit:
        pass
    except BaseException as e:   # помилка в обробнику подій
        if report:
            report(e)
    finally:
        deadline = None
        try:
            flush()
        except Exception:
            pass


def pump():
    """Обробити події, що накопичилися, поки працює основна програма (update())."""
    flush()
    if can_sync():
        wait(api.tick())
        _last_yield[0] = time.time()
    try:
        evs = json.loads(str(api.take()))
    except Exception:
        evs = []
    for ev in evs:
        handle(ev)
    flush()


# ---------- таймери (after / ontimer) ----------
def set_timer(ms, fn, owner=None):
    _tid[0] += 1
    t = _tid[0]
    _timers[t] = (fn, owner)
    send('after', t=t, ms=max(0, int(ms)))
    return t


def cancel_timer(t):
    if _timers.pop(t, None) is not None:
        send('cancel', t=t)


def cancel_owned(owner):
    for t, (fn, o) in list(_timers.items()):
        if o is owner:
            cancel_timer(t)


def _on_timer(ev):
    item = _timers.pop(ev.get('t'), None)
    if item:
        item[0]()


on('timer', _on_timer)


# ---------- контроль виконання ----------
def check():
    """Викликається з трасувальника кожні кількасот рядків коду учня."""
    try:
        stop = api.stopped()
    except Exception:
        stop = False
    if stop:
        raise KeyboardInterrupt
    now = time.time()
    if in_main and _run_sync is not None and now - _last_yield[0] > 0.05 and can_sync():
        flush()
        wait(api.tick())
        _last_yield[0] = time.time()
        if api.stopped():
            raise KeyboardInterrupt
    elif deadline is not None and now > deadline:
        raise LPTimeout()


# ---------- кольори ----------
CSS_COLORS = set("""aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod
darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew
hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen""".split())
TK_EXTRA = {'navyblue': 'navy', 'violetred': '#d02090', 'lightgoldenrod': '#eedd82', 'lightslateblue': '#8470ff',
            'systembuttonface': '#f0f0f0', 'systemwindow': '#ffffff', 'systembuttontext': '#000000',
            'systemwindowtext': '#000000', 'systemhighlight': '#0078d7', 'transparent': 'transparent'}


class ColorError(Exception):
    pass


def color(c):
    if c is None:
        return None
    if isinstance(c, (tuple, list)):
        if len(c) == 3:
            return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)
        raise ColorError('неправильний колір: %r' % (c,))
    c = str(c)
    if c == '':
        return ''
    s = c.strip()
    if s.startswith('#'):
        h = s[1:]
        if len(h) in (3, 6) and all(ch in '0123456789abcdefABCDEF' for ch in h):
            return s
        if len(h) in (9, 12) and all(ch in '0123456789abcdefABCDEF' for ch in h):
            n = len(h) // 3
            return '#' + ''.join(h[i * n:i * n + 2] for i in range(3))
        raise ColorError('невідомий колір "%s"' % c)
    k = s.lower().replace(' ', '')
    if k in CSS_COLORS:
        return k
    if k in TK_EXTRA:
        return TK_EXTRA[k]
    for g in ('gray', 'grey'):
        if k.startswith(g) and k[len(g):].isdigit():
            v = round(int(k[len(g):]) * 2.55)
            return '#%02x%02x%02x' % (v, v, v)
    if k[-1:] in '1234' and k[:-1] in CSS_COLORS:
        return k[:-1]
    if k[-1:] in '1234' and k[:-1] in TK_EXTRA:
        return TK_EXTRA[k[:-1]]
    raise ColorError('невідомий колір "%s"' % c)


def font(f, default=None):
    """Шрифт Tk -> {'css':..., 'u':bool}."""
    if f is None:
        return default
    fam, size, styles = 'Segoe UI', 9, []
    if hasattr(f, '_lp_font'):
        f = f._lp_font()
    if isinstance(f, str):
        s = f.strip()
        if s.startswith('{'):
            end = s.find('}')
            fam = s[1:end]
            rest = s[end + 1:].split()
        else:
            parts = s.split()
            i = 0
            while i < len(parts) and not parts[i].lstrip('-').isdigit():
                i += 1
            fam = ' '.join(parts[:i]) or fam
            rest = parts[i:]
        if rest and rest[0].lstrip('-').isdigit():
            size = int(rest[0])
            rest = rest[1:]
        styles = rest
    elif isinstance(f, (tuple, list)):
        if len(f) > 0 and f[0]:
            fam = str(f[0])
        if len(f) > 1:
            try:
                size = int(f[1])
            except (TypeError, ValueError):
                pass
        for x in f[2:]:
            styles += str(x).split()
    px = round(size * 4 / 3) if size > 0 else -size
    if px == 0:
        px = 12
    st = [x.lower() for x in styles]
    css = ('italic ' if 'italic' in st else '') + ('bold ' if 'bold' in st else '') + '%dpx ' % px
    css += "'%s', 'Segoe UI', system-ui, sans-serif" % fam.replace("'", '')
    return {'css': css, 'u': 'underline' in st, 's': 'overstrike' in st, 'px': px}
