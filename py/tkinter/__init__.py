"""Сумісна з tkinter емуляція для браузера (курс learn-python).
Код учня лишається звичайним кодом tkinter і без змін працює в Thonny чи VS Code."""
import _lpbridge as _B

TkVersion = 8.6
TclVersion = 8.6

# ---------- константи ----------
NO = FALSE = OFF = 0
YES = TRUE = ON = 1
N, S, W, E = 'n', 's', 'w', 'e'
NW, SW, NE, SE, NS, EW, NSEW, CENTER = 'nw', 'sw', 'ne', 'se', 'ns', 'ew', 'nsew', 'center'
NONE, X, Y, BOTH = 'none', 'x', 'y', 'both'
LEFT, TOP, RIGHT, BOTTOM = 'left', 'top', 'right', 'bottom'
RAISED, SUNKEN, FLAT, RIDGE, GROOVE, SOLID = 'raised', 'sunken', 'flat', 'ridge', 'groove', 'solid'
HORIZONTAL, VERTICAL = 'horizontal', 'vertical'
NUMERIC = 'numeric'
CHAR, WORD = 'char', 'word'
BASELINE = 'baseline'
INSIDE, OUTSIDE = 'inside', 'outside'
SEL, SEL_FIRST, SEL_LAST, END, INSERT, CURRENT, ANCHOR, ALL = 'sel', 'sel.first', 'sel.last', 'end', 'insert', 'current', 'anchor', 'all'
NORMAL, DISABLED, ACTIVE, HIDDEN = 'normal', 'disabled', 'active', 'hidden'
CASCADE, CHECKBUTTON, COMMAND, RADIOBUTTON, SEPARATOR = 'cascade', 'checkbutton', 'command', 'radiobutton', 'separator'
SINGLE, BROWSE, MULTIPLE, EXTENDED = 'single', 'browse', 'multiple', 'extended'
DOTBOX, UNDERLINE = 'dotbox', 'underline'
PIESLICE, CHORD, ARC, FIRST, LAST, BUTT, PROJECTING, ROUND, BEVEL, MITER = 'pieslice', 'chord', 'arc', 'first', 'last', 'butt', 'projecting', 'round', 'bevel', 'miter'
MOVETO, SCROLL, UNITS, PAGES = 'moveto', 'scroll', 'units', 'pages'


class TclError(Exception):
    pass


_ids = [0]
_widgets = {}
_roots = []
_default_root = None
_listen_all = {}


def _newid():
    _ids[0] += 1
    return _ids[0]


def _reset():
    global _default_root
    _widgets.clear()
    _roots.clear()
    _default_root = None


_B.on_reset(_reset)


def _c(v):
    return _B.color(v)


def _get_root():
    global _default_root
    if _default_root is None or _default_root._dead:
        Tk()
    return _default_root


# ---------- змінні ----------
class Variable:
    _default = ''
    _vn = [0]

    def __init__(self, master=None, value=None, name=None):
        Variable._vn[0] += 1
        self._name = name or 'PY_VAR%d' % Variable._vn[0]
        self._value = self._default if value is None else value
        self._traces = []
        self._users = []

    def __str__(self):
        return self._name

    def _conv(self, v):
        return v

    def set(self, value):
        self._value = value
        for w in list(self._users):
            if not w._dead:
                w._var_changed(self)
        for mode, cb, cid in list(self._traces):
            if 'w' in mode or 'write' in mode:
                cb(self._name, '', 'write')

    def get(self):
        return self._conv(self._value)

    initialize = set

    def trace_add(self, mode, callback):
        modes = mode if isinstance(mode, (list, tuple)) else [mode]
        cid = '%s_trace%d' % (self._name, len(self._traces))
        self._traces.append((tuple(modes), callback, cid))
        return cid

    def trace_remove(self, mode, cbname):
        self._traces = [t for t in self._traces if t[2] != cbname]

    def trace(self, mode, callback):
        return self.trace_add('write' if 'w' in mode else mode, callback)

    trace_variable = trace

    def trace_vdelete(self, mode, cbname):
        self.trace_remove(mode, cbname)

    def trace_info(self):
        return [(t[0], t[2]) for t in self._traces]


class StringVar(Variable):
    _default = ''

    def get(self):
        v = self._value
        return v if isinstance(v, str) else str(v)


class IntVar(Variable):
    _default = 0

    def get(self):
        v = self._value
        try:
            return int(v)
        except (TypeError, ValueError):
            try:
                return int(float(v))
            except (TypeError, ValueError):
                raise TclError('expected integer but got "%s"' % v)


class DoubleVar(Variable):
    _default = 0.0

    def get(self):
        try:
            return float(self._value)
        except (TypeError, ValueError):
            raise TclError('expected floating-point number but got "%s"' % self._value)


class BooleanVar(Variable):
    _default = False

    def get(self):
        v = self._value
        if isinstance(v, str):
            if v.lower() in ('1', 'true', 'yes', 'on'):
                return True
            if v.lower() in ('0', 'false', 'no', 'off', ''):
                return False
            raise TclError('expected boolean value but got "%s"' % v)
        return bool(v)


# ---------- події ----------
class Event:
    def __init__(self, **kw):
        self.widget = None
        self.x = self.y = self.x_root = self.y_root = 0
        self.char = ''
        self.keysym = '??'
        self.keycode = 0
        self.keysym_num = 0
        self.num = '??'
        self.delta = 0
        self.width = self.height = 0
        self.state = 0
        self.type = ''
        self.serial = 0
        self.time = 0
        self.__dict__.update(kw)

    def __repr__(self):
        return '<%s event x=%s y=%s keysym=%s>' % (self.type, self.x, self.y, self.keysym)


_MODS = {'Control', 'Shift', 'Alt', 'Double', 'Triple', 'B1', 'B2', 'B3', 'Button1', 'Button2', 'Button3',
         'Lock', 'Meta', 'Command', 'Option', 'Mod1', 'Any'}
_TYPES = {'Button': 'ButtonPress', 'ButtonPress': 'ButtonPress', 'ButtonRelease': 'ButtonRelease',
          'Motion': 'Motion', 'Key': 'KeyPress', 'KeyPress': 'KeyPress', 'KeyRelease': 'KeyRelease',
          'Enter': 'Enter', 'Leave': 'Leave', 'Configure': 'Configure', 'FocusIn': 'FocusIn',
          'FocusOut': 'FocusOut', 'MouseWheel': 'MouseWheel', 'Destroy': 'Destroy', 'Map': 'Map',
          'Visibility': 'Visibility', 'Expose': 'Expose', 'Activate': 'Activate', 'Deactivate': 'Deactivate'}


def _parse_seq(seq):
    if not isinstance(seq, str) or not seq:
        raise TclError('bad event pattern')
    if seq.startswith('<<'):
        return ('Virtual', seq, frozenset())
    if not seq.startswith('<'):
        ch = seq[0]
        return ('KeyPress', 'space' if ch == ' ' else ch, frozenset())
    parts = seq.strip('<>').split('-')
    mods = []
    while len(parts) > 1 and parts[0] in _MODS:
        mods.append(parts.pop(0))
    t = parts[0]
    detail = '-'.join(parts[1:]) or None
    if t in _TYPES:
        t = _TYPES[t]
    elif t in ('1', '2', '3', '4', '5'):
        t, detail = 'ButtonPress', t
    else:
        t, detail = 'KeyPress', t
    if detail in ('minus',):
        detail = 'minus'
    return (t, detail, frozenset(mods))


def _match(pat, ev):
    t, d, mods = pat
    if t != ev['type']:
        return -1
    if t in ('ButtonPress',):
        dbl = 'Double' in mods
        if dbl != ev.get('dbl', False):
            return -1
    if d is not None and str(d) != str(ev.get('detail')):
        return -1
    held = ev.get('mods', ())
    for m in mods:
        if m in ('Double', 'Triple', 'Any'):
            continue
        if m in ('B1', 'Button1') and 1 not in ev.get('buttons', ()):
            return -1
        if m in ('B2', 'Button2') and 2 not in ev.get('buttons', ()):
            return -1
        if m in ('B3', 'Button3') and 3 not in ev.get('buttons', ()):
            return -1
        if m in ('Control', 'Shift', 'Alt', 'Meta', 'Command') and m not in held:
            return -1
    return (2 if d is not None else 0) + len(mods)


def _kinds(pat):
    t, d, mods = pat
    if t in ('ButtonPress', 'ButtonRelease'):
        return ['click']
    if t == 'Motion':
        return ['motion']
    if t in ('Enter', 'Leave'):
        return ['hover']
    if t in ('KeyPress', 'KeyRelease'):
        return ['key']
    if t == 'MouseWheel':
        return ['wheel']
    if t == 'Configure':
        return ['size']
    return []


# ---------- базовий клас ----------
class Misc:
    _dead = False
    _cls = 'Misc'

    def _root(self):
        w = self
        while getattr(w, 'master', None) is not None:
            w = w.master
        return w

    def _toplevel(self):
        w = self
        while w is not None and not isinstance(w, (Tk, Toplevel)):
            w = w.master
        return w

    # --- прив'язки ---
    def bind(self, sequence=None, func=None, add=None):
        if sequence is None:
            return [b[0] for b in self._binds]
        pat = _parse_seq(sequence)
        if func is None:
            return ''.join(str(b[2]) for b in self._binds if b[1] == pat)
        if not add:
            self._binds = [b for b in self._binds if b[1] != pat]
        fid = '%d%s' % (id(func), sequence)
        self._binds.append((sequence, pat, func, fid))
        k = _kinds(pat)
        if k:
            _B.send('listen', id=self._id, k=k)
        return fid

    def unbind(self, sequence, funcid=None):
        pat = _parse_seq(sequence)
        self._binds = [b for b in self._binds if not (b[1] == pat and (funcid is None or b[3] == funcid))]

    def bind_all(self, sequence=None, func=None, add=None):
        r = self._root()
        return Misc.bind(r, sequence, func, add)

    def unbind_all(self, sequence):
        self._root().unbind(sequence)

    def bind_class(self, className, sequence=None, func=None, add=None):
        return self.bind_all(sequence, func, add)

    def event_generate(self, sequence, **kw):
        pat = _parse_seq(sequence)
        ev = {'type': pat[0], 'detail': pat[1], 'mods': ()}
        _fire(self, ev, Event(widget=self, type=pat[0], **{k: v for k, v in kw.items() if k in ('x', 'y')}))

    def event_add(self, virtual, *seqs):
        pass

    # --- таймери ---
    def after(self, ms, func=None, *args):
        if func is None:
            import time
            time.sleep(ms / 1000)
            return None
        root = self._root()
        if args:
            f = lambda: func(*args)
        else:
            f = func
        return 'after#%d' % _B.set_timer(ms, f, owner=root)

    def after_idle(self, func, *args):
        return self.after(0, func, *args)

    def after_cancel(self, id):
        if isinstance(id, str) and id.startswith('after#'):
            _B.cancel_timer(int(id[6:]))

    # --- цикл подій ---
    def mainloop(self, n=0):
        _B.flush()

    def update(self):
        _B.pump()

    def update_idletasks(self):
        _B.flush()

    def quit(self):
        pass

    def wait_window(self, window=None):
        pass

    def wait_variable(self, name=None):
        pass

    # --- фокус ---
    def focus_set(self):
        tl = self._toplevel()
        if tl is not None:
            tl._focus = self
        _B.send('focus', id=self._id)

    focus = focus_force = focus_set

    def focus_get(self):
        tl = self._toplevel()
        return getattr(tl, '_focus', tl)

    # --- інформація ---
    def winfo_width(self):
        return int(self._size[0]) if self._size else 1

    def winfo_height(self):
        return int(self._size[1]) if self._size else 1

    def winfo_reqwidth(self):
        return self.winfo_width()

    def winfo_reqheight(self):
        return self.winfo_height()

    def winfo_screenwidth(self):
        return 1920

    def winfo_screenheight(self):
        return 1080

    def winfo_exists(self):
        return 0 if self._dead else 1

    def winfo_children(self):
        return [w for w in self._children if not w._dead]

    def winfo_toplevel(self):
        return self._toplevel()

    def winfo_x(self):
        return 0

    winfo_y = winfo_rootx = winfo_rooty = winfo_x

    def winfo_ismapped(self):
        return 0 if self._dead else 1

    def winfo_class(self):
        return self._cls

    def winfo_pointerx(self):
        return 0

    winfo_pointery = winfo_pointerx

    def winfo_rgb(self, color):
        c = _c(color)
        return (0, 0, 0) if not c else (0, 0, 0)

    def bell(self):
        _B.send('bell')

    def option_add(self, *a, **k):
        pass

    def tk_setPalette(self, *a, **k):
        pass

    def register(self, func, *a):
        return func

    def nametowidget(self, name):
        return name if isinstance(name, Misc) else None

    def grid_columnconfigure(self, index, weight=None, minsize=None, **kw):
        idxs = index if isinstance(index, (list, tuple)) else [index]
        for i in idxs:
            if isinstance(i, int):
                _B.send('gcfg', id=self._id, a='c', i=i, w=weight, m=minsize)

    def grid_rowconfigure(self, index, weight=None, minsize=None, **kw):
        idxs = index if isinstance(index, (list, tuple)) else [index]
        for i in idxs:
            if isinstance(i, int):
                _B.send('gcfg', id=self._id, a='r', i=i, w=weight, m=minsize)

    columnconfigure = grid_columnconfigure
    rowconfigure = grid_rowconfigure

    def grid_propagate(self, flag=None):
        _B.send('prop', id=self._id, v=bool(flag) if flag is not None else True)

    pack_propagate = grid_propagate

    def grid_slaves(self, row=None, column=None):
        return [w for w in self._children if w._mgr == 'grid' and not w._dead]

    def pack_slaves(self):
        return [w for w in self._children if w._mgr == 'pack' and not w._dead]

    slaves = pack_slaves

    def grid_size(self):
        cols = rows = 0
        for w in self.grid_slaves():
            cols = max(cols, w._mi.get('column', 0) + w._mi.get('columnspan', 1))
            rows = max(rows, w._mi.get('row', 0) + w._mi.get('rowspan', 1))
        return (cols, rows)

    def grid_anchor(self, anchor=None):
        pass

    def clipboard_clear(self):
        pass

    def clipboard_append(self, s):
        pass

    def keys(self):
        return list(self._o.keys())

    def __setitem__(self, key, value):
        self.configure(**{key: value})

    def __getitem__(self, key):
        return self.cget(key)

    def __str__(self):
        return '.!%s%d' % (self._cls.lower(), self._id)


def _alias(kw):
    out = {}
    for k, v in kw.items():
        k = {'background': 'bg', 'foreground': 'fg', 'borderwidth': 'bd', 'from': 'from_'}.get(k, k)
        if k.endswith('_') and k not in ('from_',):
            k = k[:-1]
        out[k] = v
    return out


class Tk(Misc):
    _cls = 'Tk'

    def __init__(self, screenName=None, baseName=None, className='Tk', useTk=True, sync=False, use=None):
        global _default_root
        self.master = None
        self._id = _newid()
        self._children = []
        self._binds = []
        self._o = {'bg': '#f0f0f0'}
        self._size = None
        self._title = 'tk'
        self._protocols = {}
        self._focus = None
        self._mgr = None
        self._mi = {}
        _widgets[self._id] = self
        _roots.append(self)
        if _default_root is None or _default_root._dead:
            _default_root = self
        _B.send('win', id=self._id, title=self._title, top=isinstance(self, Toplevel))
        self.children = {}

    def title(self, string=None):
        if string is None:
            return self._title
        self._title = str(string)
        _B.send('title', id=self._id, t=self._title)

    wm_title = title

    def geometry(self, newGeometry=None):
        if newGeometry is None:
            if self._size:
                return '%dx%d+0+0' % tuple(self._size)
            return '200x200+0+0'
        g = str(newGeometry)
        size = g.split('+')[0].split('-')[0]
        if 'x' in size:
            w, h = size.split('x')
            try:
                self._size = (int(w), int(h))
            except ValueError:
                raise TclError('bad geometry specifier "%s"' % g)
            _B.send('geom', id=self._id, w=self._size[0], h=self._size[1])

    wm_geometry = geometry

    def configure(self, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        kw = _alias(kw)
        if not kw:
            return dict(self._o)
        for k, v in kw.items():
            self._o[k] = v
        o = {}
        if 'bg' in kw:
            o['bg'] = _c(kw['bg'])
        if 'cursor' in kw:
            o['cursor'] = kw['cursor']
        if 'width' in kw or 'height' in kw:
            w = int(self._o.get('width', 0) or 0)
            h = int(self._o.get('height', 0) or 0)
            o['w'], o['h'] = w, h
        if 'padx' in kw:
            o['padx'] = kw['padx']
        if 'pady' in kw:
            o['pady'] = kw['pady']
        _B.send('cfg', id=self._id, o=o)

    config = configure

    def cget(self, key):
        key = _alias({key: 0}).popitem()[0]
        return self._o.get(key, '')

    def resizable(self, width=None, height=None):
        pass

    def minsize(self, width=None, height=None):
        if width:
            _B.send('minsize', id=self._id, w=width, h=height or 0)

    def maxsize(self, width=None, height=None):
        pass

    def iconbitmap(self, *a, **k):
        pass

    def iconphoto(self, *a, **k):
        pass

    def wm_iconphoto(self, *a, **k):
        pass

    def attributes(self, *a, **k):
        pass

    wm_attributes = attributes

    def overrideredirect(self, flag=None):
        pass

    def state(self, newstate=None):
        return 'normal'

    def withdraw(self):
        _B.send('show', id=self._id, v=False)

    def iconify(self):
        pass

    def deiconify(self):
        _B.send('show', id=self._id, v=True)

    def lift(self, aboveThis=None):
        pass

    tkraise = lift

    def protocol(self, name=None, func=None):
        self._protocols[name] = func

    wm_protocol = protocol

    def transient(self, master=None):
        pass

    def grab_set(self):
        pass

    def grab_release(self):
        pass

    def destroy(self):
        global _default_root
        if self._dead:
            return
        _destroy_tree(self)
        _B.cancel_owned(self)
        _B.send('del', id=self._id)
        if self is _default_root:
            _default_root = None

    def report_callback_exception(self, exc, val, tb):
        raise val

    def _var_changed(self, var):
        pass


def _destroy_tree(w):
    for c in list(w._children):
        _destroy_tree(c)
    w._dead = True
    for (seq, pat, func, fid) in w._binds:
        if pat[0] == 'Destroy':
            try:
                func(Event(widget=w, type='Destroy'))
            except Exception:
                pass
    _widgets.pop(w._id, None)
    for var in getattr(w, '_vars', ()):
        if w in var._users:
            var._users.remove(w)


class Toplevel(Tk):
    _cls = 'Toplevel'

    def __init__(self, master=None, cnf={}, **kw):
        Tk.__init__(self)
        self.master = master or _get_root()
        self.master._children.append(self)
        if cnf or kw:
            self.configure(cnf, **kw)


Wm = Tk


class Widget(Misc):
    _cls = 'Frame'
    _defaults = {}

    def __init__(self, master=None, cnf={}, **kw):
        if master is None:
            master = _get_root()
        if getattr(master, '_dead', False):
            raise TclError("can't invoke \"%s\" command: application has been destroyed" % self._cls.lower())
        self.master = master
        self._id = _newid()
        self._children = []
        self._binds = []
        self._size = None
        self._mgr = None
        self._mi = {}
        self._vars = []
        self._o = dict(self._defaults)
        kw = dict(cnf, **kw)
        kw = _alias(kw)
        kw.pop('name', None)
        self._o.update(kw)
        self._init()
        master._children.append(self)
        _widgets[self._id] = self
        self.children = {}
        _B.send('new', id=self._id, p=master._id, cls=self._cls, o=self._render(self._o))
        for k in ('textvariable', 'variable', 'listvariable'):
            v = self._o.get(k)
            if isinstance(v, Variable):
                self._track(v)

    def _init(self):
        pass

    def _track(self, var):
        if self not in var._users:
            var._users.append(self)
        self._vars.append(var)

    def _var_changed(self, var):
        if var is self._o.get('textvariable'):
            _B.send('cfg', id=self._id, o={'text': var.get()})

    # --- опції ---
    def _render(self, o):
        r = {}
        for k, v in o.items():
            if k in ('bg', 'fg', 'activebackground', 'activeforeground', 'highlightbackground', 'highlightcolor',
                     'selectcolor', 'disabledforeground', 'insertbackground', 'troughcolor', 'selectbackground',
                     'selectforeground', 'readonlybackground', 'disabledbackground'):
                r[k] = _c(v)
            elif k == 'font':
                r[k] = _B.font(v)
            elif k == 'textvariable':
                if isinstance(v, Variable):
                    r['text'] = v.get()
            elif k in ('command', 'variable', 'listvariable', 'image', 'validatecommand', 'invalidcommand', 'xscrollcommand', 'yscrollcommand', 'postcommand'):
                continue
            elif isinstance(v, (int, float, str, bool)) or v is None:
                r[k] = v
            elif isinstance(v, (list, tuple)):
                r[k] = [str(x) for x in v]
        return r

    def configure(self, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        kw = _alias(kw)
        if not kw:
            return {k: v for k, v in self._o.items()}
        kw.pop('name', None)
        self._o.update(kw)
        for k in ('textvariable', 'variable', 'listvariable'):
            v = kw.get(k)
            if isinstance(v, Variable):
                self._track(v)
        self._configured(kw)
        _B.send('cfg', id=self._id, o=self._render(kw))

    config = configure

    def _configured(self, kw):
        pass

    def cget(self, key):
        key = _alias({key: 0}).popitem()[0]
        v = self._o.get(key, '')
        if key == 'text' and isinstance(self._o.get('textvariable'), Variable):
            return self._o['textvariable'].get()
        return v

    # --- менеджери розміщення ---
    def pack(self, cnf={}, **kw):
        kw = dict(cnf, **kw)
        mi = {}
        for k, v in kw.items():
            k = k.rstrip('_')
            if k in ('side', 'fill', 'anchor'):
                mi[k] = str(v)
            elif k == 'expand':
                mi[k] = bool(v) and str(v) not in ('0', 'no', 'false')
            elif k in ('padx', 'pady', 'ipadx', 'ipady'):
                mi[k] = list(v) if isinstance(v, (list, tuple)) else [v, v]
            elif k in ('before', 'after'):
                mi[k] = v._id
        self._mgr = 'pack'
        self._mi = mi
        _B.send('mgr', id=self._id, m='pack', o=mi)

    pack_configure = pack

    def pack_forget(self):
        self._mgr = None
        _B.send('mgr', id=self._id, m=None, o={})

    def pack_info(self):
        return dict(self._mi)

    def grid(self, cnf={}, **kw):
        kw = dict(cnf, **kw)
        mi = dict(self._mi) if self._mgr == 'grid' else {}
        if self._mgr != 'grid':
            mi.setdefault('row', self._next_row())
            mi.setdefault('column', 0)
        for k, v in kw.items():
            k = k.rstrip('_')
            if k in ('row', 'column', 'columnspan', 'rowspan'):
                mi[k] = int(v)
            elif k == 'sticky':
                mi[k] = str(v).lower().replace(',', '').replace(' ', '')
            elif k in ('padx', 'pady', 'ipadx', 'ipady'):
                mi[k] = list(v) if isinstance(v, (list, tuple)) else [v, v]
        self._mgr = 'grid'
        self._mi = mi
        _B.send('mgr', id=self._id, m='grid', o=mi)

    grid_configure = grid

    def _next_row(self):
        r = 0
        for w in self.master._children:
            if w is not self and w._mgr == 'grid' and not w._dead:
                r = max(r, w._mi.get('row', 0) + w._mi.get('rowspan', 1))
        return r

    def grid_forget(self):
        self._mgr = None
        _B.send('mgr', id=self._id, m=None, o={})

    grid_remove = grid_forget

    def grid_info(self):
        return dict(self._mi)

    def place(self, cnf={}, **kw):
        kw = dict(cnf, **kw)
        mi = dict(self._mi) if self._mgr == 'place' else {}
        for k, v in kw.items():
            k = k.rstrip('_')
            if k in ('x', 'y', 'width', 'height', 'relx', 'rely', 'relwidth', 'relheight'):
                mi[k] = float(v)
            elif k in ('anchor', 'bordermode'):
                mi[k] = str(v)
        self._mgr = 'place'
        self._mi = mi
        _B.send('mgr', id=self._id, m='place', o=mi)

    place_configure = place

    def place_forget(self):
        self._mgr = None
        _B.send('mgr', id=self._id, m=None, o={})

    def place_info(self):
        return dict(self._mi)

    def destroy(self):
        if self._dead:
            return
        _destroy_tree(self)
        if self in self.master._children:
            self.master._children.remove(self)
        _B.send('del', id=self._id)

    def lift(self, aboveThis=None):
        _B.send('raise', id=self._id)

    tkraise = lift

    def lower(self, belowThis=None):
        pass

    def invoke(self):
        return self._invoke()

    def _invoke(self):
        if self._o.get('state') == DISABLED:
            return None
        cmd = self._o.get('command')
        if callable(cmd):
            return cmd()

    def flash(self):
        pass

    def _ui(self, ev):
        pass


class Frame(Widget):
    _cls = 'Frame'


class LabelFrame(Widget):
    _cls = 'LabelFrame'


class Label(Widget):
    _cls = 'Label'


class Message(Widget):
    _cls = 'Message'


class Button(Widget):
    _cls = 'Button'


class _Selectable(Widget):
    def _init(self):
        if self._cls == 'Checkbutton' and not isinstance(self._o.get('variable'), Variable):
            self._o['variable'] = IntVar(value=0)
        self._push_state(send=False)

    def _is_on(self):
        var = self._o.get('variable')
        if not isinstance(var, Variable):
            return False
        cur = var._value
        if self._cls == 'Checkbutton':
            on = self._o.get('onvalue', 1)
            return str(cur) == str(on) or (cur is True and str(on) == '1')
        val = self._o.get('value', '')
        return str(cur) == str(val)

    def _push_state(self, send=True):
        self._o['_on'] = self._is_on()
        if send:
            _B.send('cfg', id=self._id, o={'_on': self._o['_on']})

    def _var_changed(self, var):
        Widget._var_changed(self, var)
        if var is self._o.get('variable'):
            self._push_state()

    def _configured(self, kw):
        if 'variable' in kw or 'value' in kw or 'onvalue' in kw:
            self._o['_on'] = self._is_on()
            kw['_on'] = self._o['_on']

    def _invoke(self):
        if self._o.get('state') == DISABLED:
            return None
        var = self._o.get('variable')
        if self._cls == 'Checkbutton':
            on = self._is_on()
            v = self._o.get('offvalue', 0) if on else self._o.get('onvalue', 1)
            if isinstance(var, BooleanVar):
                v = not on
            var.set(v)
        else:
            if isinstance(var, Variable):
                var.set(self._o.get('value', ''))
        cmd = self._o.get('command')
        if callable(cmd):
            return cmd()

    def select(self):
        var = self._o.get('variable')
        if isinstance(var, Variable):
            var.set(self._o.get('onvalue', 1) if self._cls == 'Checkbutton' else self._o.get('value', ''))

    def deselect(self):
        var = self._o.get('variable')
        if isinstance(var, Variable):
            var.set(self._o.get('offvalue', 0) if self._cls == 'Checkbutton' else '')

    def toggle(self):
        if self._is_on():
            self.deselect()
        else:
            self.select()


class Checkbutton(_Selectable):
    _cls = 'Checkbutton'


class Radiobutton(_Selectable):
    _cls = 'Radiobutton'


def _ix(index, text):
    if isinstance(index, str):
        if index in (END, 'end'):
            return len(text)
        if index in (INSERT, 'insert', ANCHOR, 'anchor', SEL_FIRST, SEL_LAST):
            return len(text)
        try:
            index = int(index)
        except ValueError:
            raise TclError('bad entry index "%s"' % index)
    return max(0, min(len(text), int(index)))


class Entry(Widget):
    _cls = 'Entry'

    def _init(self):
        tv = self._o.get('textvariable')
        self._text = tv.get() if isinstance(tv, Variable) else ''
        self._o['value'] = self._text

    def _set(self, text, push=True, from_ui=False):
        self._text = text
        tv = self._o.get('textvariable')
        if isinstance(tv, Variable) and tv._value != text:
            self._mute = True
            try:
                tv.set(text)
            finally:
                self._mute = False
        if push:
            _B.send('val', id=self._id, v=text)

    def _var_changed(self, var):
        if var is self._o.get('textvariable') and not getattr(self, '_mute', False):
            self._text = var.get()
            _B.send('val', id=self._id, v=self._text)

    def get(self):
        return self._text

    def insert(self, index, string):
        t = self._text
        i = _ix(index, t)
        self._set(t[:i] + str(string) + t[i:])

    def delete(self, first, last=None):
        t = self._text
        a = _ix(first, t)
        b = a + 1 if last is None else _ix(last, t)
        if b < a:
            return
        self._set(t[:a] + t[b:])

    def _ui(self, ev):
        self._set(ev.get('v', ''), push=False, from_ui=True)

    def icursor(self, index):
        pass

    def select_range(self, start, end):
        _B.send('selall', id=self._id)

    selection_range = select_range

    def select_clear(self):
        pass

    selection_clear = select_clear

    def xview(self, *a):
        pass


class Spinbox(Entry):
    _cls = 'Spinbox'

    def _init(self):
        Entry._init(self)
        if not self._text:
            vals = self._o.get('values')
            if vals:
                self._text = str(list(vals)[0])
            else:
                f = self._o.get('from_', 0)
                self._text = str(int(f) if float(f).is_integer() else f)
            self._o['value'] = self._text

    def _ui(self, ev):
        Entry._ui(self, ev)
        if ev.get('step'):
            cmd = self._o.get('command')
            if callable(cmd):
                cmd()


class Text(Widget):
    _cls = 'Text'

    def _init(self):
        self._text = ''

    def _ix(self, index):
        t = self._text
        if isinstance(index, (int, float)) and not isinstance(index, bool):
            index = str(float(index)) if isinstance(index, float) else '%d.0' % index
        s = str(index)
        extra = 0
        for op in ('-', '+'):
            if op in s and s.split(op)[0] in ('end', 'insert') or (op in s and '.' in s.split(op)[0]):
                base, _, rest = s.partition(op)
                n = int(''.join(ch for ch in rest if ch.isdigit()) or 0)
                if rest.strip().endswith('c') or 'chars' in rest:
                    extra = n if op == '+' else -n
                s = base
                break
        if s in ('end', END):
            pos = len(t) + 1
        elif s in ('insert', INSERT, 'current', SEL_FIRST, SEL_LAST):
            pos = len(t)
        else:
            try:
                line, col = s.split('.')
                line = int(line)
            except ValueError:
                raise TclError('bad text index "%s"' % s)
            lines = t.split('\n')
            if line < 1:
                return 0
            if line > len(lines):
                return len(t) + 1
            off = sum(len(x) + 1 for x in lines[:line - 1])
            ln = lines[line - 1]
            col = len(ln) if col == 'end' else min(int(col), len(ln))
            pos = off + col
        return max(0, min(len(t) + 1, pos + extra))

    def get(self, index1='1.0', index2=None):
        full = self._text + '\n'
        a = self._ix(index1)
        b = a + 1 if index2 is None else self._ix(index2)
        return full[a:b]

    def insert(self, index, chars, *tags):
        i = min(self._ix(index), len(self._text))
        self._text = self._text[:i] + str(chars) + self._text[i:]
        _B.send('val', id=self._id, v=self._text)

    def delete(self, index1, index2=None):
        a = min(self._ix(index1), len(self._text))
        b = a + 1 if index2 is None else min(self._ix(index2), len(self._text))
        if b > a:
            self._text = self._text[:a] + self._text[b:]
            _B.send('val', id=self._id, v=self._text)

    def _ui(self, ev):
        self._text = ev.get('v', '')

    def see(self, index):
        _B.send('see', id=self._id)

    def index(self, index):
        p = self._ix(index)
        before = self._text[:p]
        return '%d.%d' % (before.count('\n') + 1, len(before.split('\n')[-1]))

    def tag_add(self, *a, **k):
        pass

    def tag_config(self, *a, **k):
        pass

    tag_configure = tag_remove = tag_delete = mark_set = tag_config

    def edit_reset(self):
        pass

    def yview(self, *a):
        pass

    def xview(self, *a):
        pass


class Listbox(Widget):
    _cls = 'Listbox'

    def _init(self):
        self._items = []
        self._sel = []
        lv = self._o.get('listvariable')
        if isinstance(lv, Variable):
            self._items = self._from_var(lv)
        self._o['_items'] = self._items

    def _from_var(self, var):
        v = var._value
        if isinstance(v, (list, tuple)):
            return [str(x) for x in v]
        return str(v).split() if v else []

    def _var_changed(self, var):
        if var is self._o.get('listvariable'):
            self._items = self._from_var(var)
            self._push()

    def _push(self):
        _B.send('items', id=self._id, items=self._items, sel=self._sel)

    def _i(self, index):
        if index in (END, 'end'):
            return len(self._items)
        if index in (ACTIVE, 'active', ANCHOR, 'anchor'):
            return self._sel[0] if self._sel else 0
        return int(index)

    def insert(self, index, *elements):
        i = self._i(index)
        for k, e in enumerate(elements):
            self._items.insert(i + k, str(e))
        self._push()

    def delete(self, first, last=None):
        a = self._i(first)
        b = a if last is None else self._i(last)
        if last in (END, 'end'):
            b = len(self._items) - 1
        del self._items[a:b + 1]
        self._sel = [s for s in self._sel if s < len(self._items)]
        self._push()

    def get(self, first, last=None):
        if last is None:
            i = self._i(first)
            return self._items[i] if 0 <= i < len(self._items) else ''
        a = self._i(first)
        b = len(self._items) - 1 if last in (END, 'end') else self._i(last)
        return tuple(self._items[a:b + 1])

    def size(self):
        return len(self._items)

    def curselection(self):
        return tuple(self._sel)

    def selection_set(self, first, last=None):
        a = self._i(first)
        b = a if last is None else self._i(last)
        mode = self._o.get('selectmode', BROWSE)
        if mode in (BROWSE, SINGLE):
            self._sel = [a]
        else:
            self._sel = sorted(set(self._sel) | set(range(a, b + 1)))
        self._push()

    select_set = selection_set

    def selection_clear(self, first, last=None):
        self._sel = []
        self._push()

    select_clear = selection_clear

    def selection_includes(self, index):
        return self._i(index) in self._sel

    def activate(self, index):
        pass

    def see(self, index):
        pass

    def itemconfig(self, index, **kw):
        pass

    itemconfigure = itemconfig

    def nearest(self, y):
        return 0

    def _ui(self, ev):
        i = ev.get('i', 0)
        mode = self._o.get('selectmode', BROWSE)
        if mode in (MULTIPLE, EXTENDED):
            if i in self._sel:
                self._sel.remove(i)
            else:
                self._sel.append(i)
                self._sel.sort()
        else:
            self._sel = [i]
        self._push()
        _fire(self, {'type': 'Virtual', 'detail': '<<ListboxSelect>>'}, Event(widget=self, type='VirtualEvent'))


class Scale(Widget):
    _cls = 'Scale'

    def _init(self):
        var = self._o.get('variable')
        f = self._o.get('from_', 0)
        self._val = var.get() if isinstance(var, Variable) else f
        self._o['value'] = self._val

    def get(self):
        v = self._val
        res = self._o.get('resolution', 1)
        if res == 1 or res == 1.0:
            try:
                return int(round(float(v)))
            except (TypeError, ValueError):
                return 0
        return float(v)

    def set(self, value):
        self._val = value
        _B.send('val', id=self._id, v=value)
        var = self._o.get('variable')
        if isinstance(var, Variable):
            var._value = value

    def _var_changed(self, var):
        if var is self._o.get('variable'):
            self._val = var._value
            _B.send('val', id=self._id, v=self._val)

    def _ui(self, ev):
        self._val = ev.get('v', 0)
        var = self._o.get('variable')
        if isinstance(var, Variable):
            var.set(self.get() if not isinstance(var, StringVar) else str(self.get()))
        cmd = self._o.get('command')
        if callable(cmd):
            cmd(str(self.get()))


class Scrollbar(Widget):
    _cls = 'Scrollbar'

    def set(self, *a):
        pass

    def get(self):
        return (0.0, 1.0)


class Menu(Widget):
    _cls = 'Menu'

    def add_command(self, **kw):
        pass

    add_cascade = add_separator = add_checkbutton = add_radiobutton = add_command

    def entryconfig(self, *a, **k):
        pass


class Menubutton(Button):
    _cls = 'Button'


class OptionMenu(Widget):
    _cls = 'OptionMenu'

    def __init__(self, master, variable, value, *values, **kw):
        self._choices = [value] + list(values)
        Widget.__init__(self, master, textvariable=variable, values=[str(v) for v in self._choices], **kw)
        self._cmd = kw.get('command')
        if variable._value in ('', None):
            variable._value = value
        self._o['value'] = str(variable.get())
        _B.send('val', id=self._id, v=str(variable.get()))

    def _var_changed(self, var):
        _B.send('val', id=self._id, v=str(var.get()))

    def _ui(self, ev):
        var = self._o.get('textvariable')
        v = ev.get('v', '')
        var.set(v)
        if callable(self._cmd):
            self._cmd(v)


class PhotoImage:
    def __init__(self, name=None, cnf={}, master=None, **kw):
        self._w = int(kw.get('width', 0) or 0)
        self._h = int(kw.get('height', 0) or 0)
        if kw.get('file'):
            _B.out('Увага: зображення з файлів у браузері не завантажуються (%s). У Thonny цей код працюватиме.\n' % kw.get('file'), 'warn')

    def width(self):
        return self._w

    def height(self):
        return self._h

    def subsample(self, *a):
        return self

    zoom = subsample

    def put(self, *a, **k):
        pass


BitmapImage = PhotoImage


# ---------- Canvas ----------
def _flat(args):
    out = []
    for a in args:
        if isinstance(a, (list, tuple)):
            out.extend(_flat(a))
        else:
            out.append(float(a))
    return out


class Canvas(Widget):
    _cls = 'Canvas'
    _defaults = {'width': 378, 'height': 265}

    def _init(self):
        self._items = {}
        self._order = []
        self._next = 1
        self._ibinds = {}
        self._current = None
        self._size = (int(float(self._o.get('width', 378))), int(float(self._o.get('height', 265))))

    def _configured(self, kw):
        if 'width' in kw or 'height' in kw:
            self._size = (int(float(self._o.get('width', 378))), int(float(self._o.get('height', 265))))

    def _norm(self, t, kw):
        kw = _alias(kw)
        o = {}
        for k, v in kw.items():
            if k in ('fill', 'outline', 'activefill', 'activeoutline', 'disabledfill'):
                o[k] = _c(v) if v != '' else ''
            elif k == 'font':
                o[k] = _B.font(v)
            elif k == 'tags':
                continue
            elif k == 'dash':
                o[k] = list(v) if isinstance(v, (list, tuple)) else [int(x) for x in str(v).split()] if str(v).strip() and str(v).replace(' ', '').isdigit() else [4, 4]
            elif k in ('image', 'window'):
                continue
            elif isinstance(v, (int, float, str, bool)) or v is None:
                o[k] = v
        return o

    def _create(self, t, args, kw):
        xy = _flat(args)
        tags = kw.pop('tags', kw.pop('tag', ()))
        if isinstance(tags, str):
            tags = tags.split()
        iid = self._next
        self._next += 1
        o = self._norm(t, kw)
        self._items[iid] = {'t': t, 'xy': xy, 'o': o, 'tags': list(tags)}
        self._order.append(iid)
        _B.send('ci', id=self._id, i=iid, t=t, xy=xy, o=o)
        return iid

    def create_line(self, *args, **kw):
        return self._create('line', args, kw)

    def create_rectangle(self, *args, **kw):
        return self._create('rectangle', args, kw)

    def create_oval(self, *args, **kw):
        return self._create('oval', args, kw)

    def create_polygon(self, *args, **kw):
        return self._create('polygon', args, kw)

    def create_arc(self, *args, **kw):
        return self._create('arc', args, kw)

    def create_text(self, *args, **kw):
        if 'text' in kw:
            kw['text'] = str(kw['text'])
        return self._create('text', args, kw)

    def create_image(self, *args, **kw):
        kw.pop('image', None)
        return self._create('image', args, kw)

    def create_window(self, *args, **kw):
        win = kw.pop('window', None)
        iid = self._create('window', args, kw)
        if isinstance(win, Widget):
            _B.send('cwin', id=self._id, i=iid, w=win._id)
        return iid

    def create_bitmap(self, *args, **kw):
        return self._create('image', args, {})

    def _find(self, tag):
        if isinstance(tag, int):
            return [tag] if tag in self._items else []
        if isinstance(tag, (list, tuple)):
            res = []
            for x in tag:
                res += self._find(x)
            return res
        s = str(tag)
        if s.isdigit():
            i = int(s)
            return [i] if i in self._items else []
        if s == 'all':
            return list(self._order)
        if s == 'current':
            return [self._current] if self._current in self._items else []
        return [i for i in self._order if s in self._items[i]['tags']]

    def find_all(self):
        return tuple(self._order)

    def find_withtag(self, tagOrId):
        return tuple(self._find(tagOrId))

    def type(self, tagOrId):
        ids = self._find(tagOrId)
        return self._items[ids[0]]['t'] if ids else None

    def gettags(self, tagOrId):
        ids = self._find(tagOrId)
        return tuple(self._items[ids[0]]['tags'] + (['current'] if ids[0] == self._current else [])) if ids else ()

    def addtag_withtag(self, newtag, tagOrId):
        for i in self._find(tagOrId):
            if newtag not in self._items[i]['tags']:
                self._items[i]['tags'].append(newtag)

    def addtag_all(self, newtag):
        self.addtag_withtag(newtag, 'all')

    def dtag(self, tagOrId, tagToDelete=None):
        t = tagToDelete or tagOrId
        for i in self._find(tagOrId):
            if t in self._items[i]['tags']:
                self._items[i]['tags'].remove(t)

    def coords(self, tagOrId, *args):
        ids = self._find(tagOrId)
        if not ids:
            return []
        i = ids[0]
        if args:
            xy = _flat(args)
            self._items[i]['xy'] = xy
            _B.send('cc', id=self._id, i=i, xy=xy)
            return None
        return [float(v) for v in self._items[i]['xy']]

    def move(self, tagOrId, dx, dy):
        dx, dy = float(dx), float(dy)
        for i in self._find(tagOrId):
            xy = self._items[i]['xy']
            for k in range(0, len(xy) - 1, 2):
                xy[k] += dx
                xy[k + 1] += dy
            _B.send('cc', id=self._id, i=i, xy=xy)

    def moveto(self, tagOrId, x='', y=''):
        bb = self.bbox(tagOrId)
        if not bb:
            return
        dx = float(x) - bb[0] if x != '' else 0
        dy = float(y) - bb[1] if y != '' else 0
        self.move(tagOrId, dx, dy)

    def itemconfigure(self, tagOrId, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        ids = self._find(tagOrId)
        if not kw:
            return dict(self._items[ids[0]]['o']) if ids else {}
        tags = kw.pop('tags', None)
        if 'text' in kw:
            kw['text'] = str(kw['text'])
        o = self._norm(None, kw)
        for i in ids:
            if tags is not None:
                self._items[i]['tags'] = tags.split() if isinstance(tags, str) else list(tags)
            self._items[i]['o'].update(o)
            _B.send('co', id=self._id, i=i, o=o)

    itemconfig = itemconfigure

    def itemcget(self, tagOrId, option):
        ids = self._find(tagOrId)
        if not ids:
            return ''
        if option == 'tags':
            return ' '.join(self._items[ids[0]]['tags'])
        return self._items[ids[0]]['o'].get(option, '')

    def delete(self, *args):
        for a in args:
            for i in self._find(a):
                if i in self._items:
                    del self._items[i]
                    self._order.remove(i)
                    _B.send('cd', id=self._id, i=i)

    def tag_raise(self, tagOrId, aboveThis=None):
        for i in self._find(tagOrId):
            self._order.remove(i)
            self._order.append(i)
            _B.send('cz', id=self._id, i=i, top=True)

    lift = tag_raise

    def tag_lower(self, tagOrId, belowThis=None):
        for i in reversed(self._find(tagOrId)):
            self._order.remove(i)
            self._order.insert(0, i)
            _B.send('cz', id=self._id, i=i, top=False)

    def lower(self, tagOrId=None, belowThis=None):
        if tagOrId is not None:
            self.tag_lower(tagOrId)

    def _bb(self, i):
        it = self._items[i]
        xy = it['xy']
        t = it['t']
        if not xy:
            return None
        if t == 'text':
            x, y = xy[0], xy[1]
            f = it['o'].get('font') or {'px': 12}
            px = f.get('px', 12) if isinstance(f, dict) else 12
            lines = str(it['o'].get('text', '')).split('\n')
            w = max(len(l) for l in lines) * px * 0.55
            h = len(lines) * px * 1.25
            a = it['o'].get('anchor', 'center')
            x0 = x - w / 2 if a in ('center', 'n', 's') else (x if 'w' in a else x - w)
            y0 = y - h / 2 if a in ('center', 'e', 'w') else (y if 'n' in a else y - h)
            return (int(x0), int(y0), int(x0 + w), int(y0 + h))
        if t in ('image', 'window'):
            return (int(xy[0]), int(xy[1]), int(xy[0]), int(xy[1]))
        xs, ys = xy[0::2], xy[1::2]
        wd = float(it['o'].get('width', 1) or 1)
        pad = wd / 2 if t in ('line',) else (wd / 2 if it['o'].get('outline', 'x') != '' else 0)
        return (int(min(xs) - pad), int(min(ys) - pad), int(round(max(xs) + pad)), int(round(max(ys) + pad)))

    def bbox(self, *args):
        boxes = []
        for a in args or ('all',):
            for i in self._find(a):
                b = self._bb(i)
                if b:
                    boxes.append(b)
        if not boxes:
            return None
        return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

    def find_overlapping(self, x1, y1, x2, y2):
        res = []
        for i in self._order:
            if self._items[i]['o'].get('state') == 'hidden':
                continue
            b = self._bb(i)
            if b and b[0] <= x2 and b[2] >= x1 and b[1] <= y2 and b[3] >= y1:
                res.append(i)
        return tuple(res)

    def find_enclosed(self, x1, y1, x2, y2):
        res = []
        for i in self._order:
            b = self._bb(i)
            if b and b[0] >= x1 and b[2] <= x2 and b[1] >= y1 and b[3] <= y2:
                res.append(i)
        return tuple(res)

    def find_closest(self, x, y, halo=None, start=None):
        best, bd = None, None
        for i in self._order:
            b = self._bb(i)
            if not b:
                continue
            dx = max(b[0] - x, 0, x - b[2])
            dy = max(b[1] - y, 0, y - b[3])
            d = dx * dx + dy * dy
            if bd is None or d <= bd:
                best, bd = i, d
        return (best,) if best else ()

    def find_above(self, tagOrId):
        return ()

    find_below = find_above

    def tag_bind(self, tagOrId, sequence=None, func=None, add=None):
        pat = _parse_seq(sequence)
        lst = self._ibinds.setdefault(str(tagOrId), [])
        if not add:
            lst[:] = [b for b in lst if b[0] != pat]
        lst.append((pat, func))
        _B.send('listen', id=self._id, k=_kinds(pat) + ['items'])
        return '%d' % id(func)

    def tag_unbind(self, tagOrId, sequence, funcid=None):
        pat = _parse_seq(sequence)
        lst = self._ibinds.get(str(tagOrId), [])
        lst[:] = [b for b in lst if b[0] != pat]

    def canvasx(self, x, gridspacing=None):
        return float(x)

    def canvasy(self, y, gridspacing=None):
        return float(y)

    def postscript(self, **kw):
        return ''

    def xview(self, *a):
        pass

    yview = xview_moveto = yview_moveto = xview

    def scan_mark(self, x, y):
        pass

    scan_dragto = scan_mark

    def winfo_width(self):
        return int(self._size[0]) if self._size else 378

    def winfo_height(self):
        return int(self._size[1]) if self._size else 265

    winfo_reqwidth = winfo_width
    winfo_reqheight = winfo_height


# ---------- обробка подій зі сторінки ----------
def _w(ev):
    return _widgets.get(ev.get('id'))


def _call(func, e):
    return func(e)


def _fire(w, ev, e):
    """Пройтися по bindtags: віджет -> вікно -> all."""
    chain = [w]
    tl = w._toplevel() if hasattr(w, '_toplevel') else None
    if tl is not None and tl is not w:
        chain.append(tl)
    root = w._root()
    if root is not tl and root is not w:
        chain.append(root)
    for target in chain:
        best, score = None, -1
        for (seq, pat, func, fid) in target._binds:
            s = _match(pat, ev)
            if s > score:
                best, score = func, s
        if best is not None:
            r = _call(best, e)
            if r == 'break':
                return 'break'
            if w._dead:
                return None
    return None


def _mk_event(w, ev, etype):
    e = Event(widget=w, type=etype)
    e.x = int(round(ev.get('x', 0)))
    e.y = int(round(ev.get('y', 0)))
    e.x_root, e.y_root = e.x, e.y
    if 'b' in ev:
        e.num = ev['b']
    if 'keysym' in ev:
        e.keysym = ev['keysym']
        e.char = ev.get('char', '')
        e.keycode = ev.get('keycode', 0)
        e.keysym_num = ev.get('keycode', 0)
    if 'delta' in ev:
        e.delta = ev['delta']
    e.state = ev.get('state', 0)
    return e


def _on_cmd(ev):
    w = _w(ev)
    if w is not None and not w._dead:
        w._invoke()


def _on_ui(ev):
    w = _w(ev)
    if w is not None and not w._dead:
        w._ui(ev)


_MAP = {'down': 'ButtonPress', 'up': 'ButtonRelease', 'move': 'Motion', 'dbl': 'ButtonPress',
        'enter': 'Enter', 'leave': 'Leave', 'wheel': 'MouseWheel'}


def _on_mouse(ev):
    w = _w(ev)
    if w is None or w._dead:
        return
    t = _MAP.get(ev.get('k'))
    m = {'type': t, 'detail': ev.get('b'), 'dbl': ev.get('k') == 'dbl', 'buttons': ev.get('btns', []),
         'mods': ev.get('mods', [])}
    e = _mk_event(w, ev, t)
    if isinstance(w, Canvas):
        iid = ev.get('i')
        if t in ('ButtonPress', 'Motion', 'Enter'):
            w._current = iid
        if iid in w._items:
            for tag in [str(iid)] + list(w._items[iid]['tags']) + ['all']:
                for pat, func in list(w._ibinds.get(tag, [])):
                    if _match(pat, m) >= 0:
                        if func(e) == 'break':
                            return
        if t in ('Enter', 'Leave') and iid is not None:
            return
    _fire(w, m, e)


def _on_key(ev):
    w = _w(ev)
    win = _widgets.get(ev.get('win'))
    if w is None:
        if win is None or win._dead:
            return
        w = getattr(win, '_focus', None) or win
        if w._dead:
            w = win
    t = 'KeyPress' if ev.get('k') == 'down' else 'KeyRelease'
    m = {'type': t, 'detail': ev.get('keysym'), 'mods': ev.get('mods', [])}
    e = _mk_event(w, ev, t)
    _fire(w, m, e)


def _on_size(ev):
    w = _w(ev)
    if w is None or w._dead:
        return
    w._size = (int(ev.get('w', 1)), int(ev.get('h', 1)))
    m = {'type': 'Configure', 'detail': None}
    e = Event(widget=w, type='Configure', width=w._size[0], height=w._size[1])
    for (seq, pat, func, fid) in w._binds:
        if pat[0] == 'Configure':
            _call(func, e)


def _on_close(ev):
    w = _w(ev)
    if w is None or w._dead:
        return
    f = w._protocols.get('WM_DELETE_WINDOW')
    if callable(f):
        f()
    else:
        w.destroy()


_B.on('cmd', _on_cmd)
_B.on('ui', _on_ui)
_B.on('mouse', _on_mouse)
_B.on('key', _on_key)
_B.on('size', _on_size)
_B.on('close', _on_close)


def mainloop(n=0):
    _B.flush()


def NoDefaultRoot():
    pass


def image_names():
    return ()


from tkinter import constants  # noqa: E402,F401
