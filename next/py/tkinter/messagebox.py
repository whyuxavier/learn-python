"""tkinter.messagebox для браузера."""
import _lpbridge as _B

INFO, WARNING, ERROR, QUESTION = 'info', 'warning', 'error', 'question'
OK, CANCEL, YES, NO, RETRY, ABORT, IGNORE = 'ok', 'cancel', 'yes', 'no', 'retry', 'abort', 'ignore'


def _show(kind, title, message):
    _B.send('msg', k=kind, t='' if title is None else str(title), m='' if message is None else str(message))
    _B.flush()
    return 'ok'


def showinfo(title=None, message=None, **options):
    return _show('info', title, message)


def showwarning(title=None, message=None, **options):
    return _show('warning', title, message)


def showerror(title=None, message=None, **options):
    return _show('error', title, message)


def _ask(title, message):
    _B.flush()
    t = '' if title is None else str(title)
    m = '' if message is None else str(message)
    return bool(_B.api.confirm((t + '\n\n' if t else '') + m))


def askquestion(title=None, message=None, **options):
    return 'yes' if _ask(title, message) else 'no'


def askyesno(title=None, message=None, **options):
    return _ask(title, message)


def askokcancel(title=None, message=None, **options):
    return _ask(title, message)


def askretrycancel(title=None, message=None, **options):
    return _ask(title, message)


def askyesnocancel(title=None, message=None, **options):
    return _ask(title, message)
