"""tkinter.colorchooser для браузера."""
import _lpbridge as _B


def askcolor(color=None, **options):
    r = _B.api.prompt('Введи колір (наприклад, #ff8800 або red):')
    if not r:
        return (None, None)
    c = _B.color(r)
    return ((0, 0, 0), c)
