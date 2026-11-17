"""tkinter.ttk для браузера: ті самі віджети з «темним» оформленням ttk."""
import tkinter as _tk
import _lpbridge as _B
from tkinter import Variable, StringVar


class _T:
    pass


class Label(_tk.Label):
    _cls = 'TLabel'


class Button(_tk.Button):
    _cls = 'TButton'


class Entry(_tk.Entry):
    _cls = 'TEntry'


class Frame(_tk.Frame):
    _cls = 'TFrame'


class LabelFrame(_tk.LabelFrame):
    _cls = 'LabelFrame'


Labelframe = LabelFrame


class Checkbutton(_tk.Checkbutton):
    _cls = 'Checkbutton'


class Radiobutton(_tk.Radiobutton):
    _cls = 'Radiobutton'


class Scale(_tk.Scale):
    _cls = 'Scale'


class Spinbox(_tk.Spinbox):
    _cls = 'Spinbox'


class Scrollbar(_tk.Scrollbar):
    pass


class Separator(_tk.Widget):
    _cls = 'Separator'


class Progressbar(_tk.Widget):
    _cls = 'Progressbar'

    def _init(self):
        self._o.setdefault('value', 0)
        self._o.setdefault('maximum', 100)

    def step(self, amount=1.0):
        v = (float(self._o.get('value', 0)) + amount) % float(self._o.get('maximum', 100))
        self.configure(value=v)

    def start(self, interval=None):
        pass

    def stop(self):
        pass

    def __setitem__(self, key, value):
        self.configure(**{key: value})


class Combobox(_tk.Entry):
    _cls = 'Combobox'

    def _init(self):
        _tk.Entry._init(self)
        self._o['values'] = [str(v) for v in (self._o.get('values') or [])]

    def _configured(self, kw):
        if 'values' in kw:
            kw['values'] = [str(v) for v in (kw['values'] or [])]
            self._o['values'] = kw['values']

    def current(self, newindex=None):
        vals = self._o.get('values') or []
        if newindex is None:
            return vals.index(self._text) if self._text in vals else -1
        self._set(vals[newindex])

    def set(self, value):
        self._set(str(value))

    def _ui(self, ev):
        _tk.Entry._ui(self, ev)
        if ev.get('sel'):
            _tk._fire(self, {'type': 'Virtual', 'detail': '<<ComboboxSelected>>'}, _tk.Event(widget=self, type='VirtualEvent'))


class Notebook(_tk.Frame):
    _cls = 'TFrame'

    def add(self, child, **kw):
        child.pack(fill='both', expand=True)

    def select(self, *a):
        pass


class Treeview(_tk.Listbox):
    pass


class Style:
    def __init__(self, master=None):
        pass

    def configure(self, style=None, **kw):
        pass

    def map(self, style, **kw):
        pass

    def theme_use(self, name=None):
        return 'vista'

    def theme_names(self):
        return ('vista', 'clam', 'default')

    def lookup(self, *a, **k):
        return ''


def _patch_virtual():
    pass
