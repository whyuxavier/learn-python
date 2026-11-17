"""tkinter.filedialog: у браузері файлові діалоги недоступні."""
import _lpbridge as _B


def _na(*a, **k):
    _B.out('Файлові діалоги в браузері недоступні. У Thonny цей код працюватиме.\n', 'warn')
    return ''


askopenfilename = asksaveasfilename = askdirectory = _na


def askopenfile(*a, **k):
    _na()
    return None


asksaveasfile = askopenfile
