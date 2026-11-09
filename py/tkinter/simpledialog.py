"""tkinter.simpledialog для браузера."""
import _lpbridge as _B


def _ask(title, prompt):
    _B.flush()
    r = _B.api.prompt((str(title) + '\n' if title else '') + str(prompt or ''))
    return None if r is None or not isinstance(r, str) else r


def askstring(title, prompt, **kw):
    return _ask(title, prompt)


def askinteger(title, prompt, **kw):
    while True:
        r = _ask(title, prompt)
        if r is None:
            return None
        try:
            return int(r)
        except ValueError:
            _B.api.alert('Потрібно ввести ціле число.')


def askfloat(title, prompt, **kw):
    while True:
        r = _ask(title, prompt)
        if r is None:
            return None
        try:
            return float(r.replace(',', '.'))
        except ValueError:
            _B.api.alert('Потрібно ввести число.')
