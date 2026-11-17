"""Сумісна з turtle емуляція для браузера (курс learn-python)."""
import math
import _lpbridge as _B

__all__ = ['Turtle', 'RawTurtle', 'Pen', 'RawPen', 'Screen', 'TurtleScreen', 'Vec2D', 'Terminator',
           'forward', 'fd', 'back', 'bk', 'backward', 'left', 'lt', 'right', 'rt', 'goto', 'setpos', 'setposition',
           'setx', 'sety', 'setheading', 'seth', 'home', 'circle', 'dot', 'stamp', 'speed', 'position', 'pos',
           'xcor', 'ycor', 'heading', 'towards', 'distance', 'pendown', 'pd', 'down', 'penup', 'pu', 'up',
           'pensize', 'width', 'pencolor', 'fillcolor', 'color', 'begin_fill', 'end_fill', 'filling', 'isdown',
           'clear', 'reset', 'write', 'showturtle', 'st', 'hideturtle', 'ht', 'isvisible', 'shape', 'shapesize',
           'turtlesize', 'degrees', 'radians', 'clearstamps', 'clearstamp', 'undo', 'teleport', 'tilt', 'settiltangle',
           'onclick', 'onrelease', 'ondrag', 'getscreen', 'getturtle', 'getpen', 'clone',
           'bgcolor', 'title', 'setup', 'screensize', 'tracer', 'update', 'delay', 'onkey', 'onkeypress',
           'onkeyrelease', 'listen', 'onscreenclick', 'ontimer', 'mainloop', 'done', 'exitonclick', 'bye',
           'window_width', 'window_height', 'colormode', 'clearscreen', 'resetscreen', 'turtles', 'textinput',
           'numinput', 'bgpic', 'register_shape', 'addshape', 'getshapes', 'mode', 'getcanvas']


class Terminator(Exception):
    pass


class TurtleGraphicsError(Exception):
    pass


class Vec2D(tuple):
    def __new__(cls, x, y):
        return tuple.__new__(cls, (x, y))

    def __add__(self, o):
        return Vec2D(self[0] + o[0], self[1] + o[1])

    def __sub__(self, o):
        return Vec2D(self[0] - o[0], self[1] - o[1])

    def __mul__(self, o):
        if isinstance(o, Vec2D):
            return self[0] * o[0] + self[1] * o[1]
        return Vec2D(self[0] * o, self[1] * o)

    __rmul__ = __mul__

    def __neg__(self):
        return Vec2D(-self[0], -self[1])

    def __abs__(self):
        return math.hypot(self[0], self[1])

    def __repr__(self):
        return '(%.2f,%.2f)' % self


_ops = []
_screen = [None]
_pen = [None]
_tid = [0]


def _emit(op):
    _ops.append(op)
    if len(_ops) >= 400:
        _flush_ops()


def _flush_ops():
    if _ops:
        _B.send('tq', ops=list(_ops))
        _ops.clear()


_B.add_hook(_flush_ops)


def _reset():
    _ops.clear()
    _screen[0] = None
    _pen[0] = None


_B.on_reset(_reset)

_SPEEDS = {'fastest': 0, 'fast': 10, 'normal': 6, 'slow': 3, 'slowest': 1}


def _r(v):
    return round(v, 2)


class _Screen:
    def __init__(self):
        self._w, self._h = 700, 520
        self._bg = 'white'
        self._title = 'Python Turtle Graphics'
        self._turtles = []
        self._keys = {}
        self._keysup = {}
        self._clicks = {}
        self._tracer = 1
        self._cmode = 1.0
        self._mode = 'standard'
        _B.send('tscreen', w=self._w, h=self._h, bg=self._bg, t=self._title)

    # --- вигляд ---
    def setup(self, width=0.5, height=0.75, startx=None, starty=None):
        if isinstance(width, float) and width <= 1:
            width = int(1280 * width)
        if isinstance(height, float) and height <= 1:
            height = int(900 * height)
        self._w, self._h = int(width), int(height)
        _emit({'o': 'size', 'w': self._w, 'h': self._h})

    def screensize(self, canvwidth=None, canvheight=None, bg=None):
        if canvwidth is None and canvheight is None and bg is None:
            return (self._w, self._h)
        if canvwidth and canvheight:
            self.setup(int(canvwidth), int(canvheight))
        if bg is not None:
            self.bgcolor(bg)

    def bgcolor(self, *args):
        if not args:
            return self._bg
        self._bg = self._color(args)
        _emit({'o': 'bg', 'c': self._bg})

    def bgpic(self, picname=None):
        if picname and picname != 'nopic':
            _B.out('Увага: фонові зображення з файлів у браузері не завантажуються.\n', 'warn')
        return 'nopic'

    def title(self, titlestring):
        self._title = str(titlestring)
        _emit({'o': 'title', 't': self._title})

    def window_width(self):
        return self._w

    def window_height(self):
        return self._h

    def colormode(self, cmode=None):
        if cmode is None:
            return self._cmode
        self._cmode = 255 if int(cmode) == 255 else 1.0

    def mode(self, mode=None):
        if mode is None:
            return self._mode
        self._mode = mode

    def _color(self, args):
        if len(args) == 1:
            c = args[0]
        else:
            c = tuple(args)
        if isinstance(c, (tuple, list)):
            if len(c) != 3:
                raise TurtleGraphicsError('bad color sequence: %r' % (c,))
            if self._cmode == 1.0:
                if any(not (0 <= v <= 1) for v in c):
                    raise TurtleGraphicsError('bad color sequence: %r (для colormode(1.0) значення від 0 до 1)' % (c,))
                c = tuple(v * 255 for v in c)
            else:
                if any(not (0 <= v <= 255) for v in c):
                    raise TurtleGraphicsError('bad color sequence: %r' % (c,))
        return _B.color(c)

    def tracer(self, n=None, delay=None):
        if n is None:
            return self._tracer
        self._tracer = int(n)
        _emit({'o': 'tracer', 'n': self._tracer})

    def update(self):
        _emit({'o': 'update'})
        _B.pump()

    def delay(self, delay=None):
        return 10 if delay is None else None

    def turtles(self):
        return list(self._turtles)

    def clear(self):
        for t in self._turtles:
            t._vis = False
            t._state()
        self._turtles = []
        self._keys.clear()
        self._clicks.clear()
        _emit({'o': 'clearall'})

    clearscreen = clear

    def reset(self):
        for t in self._turtles:
            t.reset()

    resetscreen = reset

    # --- події ---
    def onkey(self, fun, key):
        if fun is None:
            self._keys.pop(key, None)
        else:
            self._keys[key] = fun
        _emit({'o': 'keys'})

    onkeyrelease = onkey

    def onkeypress(self, fun, key=None):
        if fun is None:
            self._keys.pop(key, None)
        else:
            self._keys[key] = fun
        _emit({'o': 'keys'})

    def listen(self, xdummy=None, ydummy=None):
        _emit({'o': 'listen'})

    def onclick(self, fun, btn=1, add=None):
        if fun is None:
            self._clicks.pop(btn, None)
        else:
            self._clicks[btn] = fun

    onscreenclick = onclick

    def ontimer(self, fun, t=0):
        _B.set_timer(t, fun, owner=self)

    def mainloop(self):
        _B.flush()

    done = mainloop

    def exitonclick(self):
        _B.flush()

    def bye(self):
        _B.cancel_owned(self)
        _emit({'o': 'bye'})

    def textinput(self, title, prompt):
        _B.flush()
        r = _B.api.prompt(str(title) + '\n' + str(prompt))
        return r if isinstance(r, str) else None

    def numinput(self, title, prompt, default=None, minval=None, maxval=None):
        while True:
            r = self.textinput(title, prompt)
            if r is None:
                return None
            try:
                v = float(r.replace(',', '.'))
            except ValueError:
                continue
            if (minval is None or v >= minval) and (maxval is None or v <= maxval):
                return v

    def register_shape(self, name, shape=None):
        pass

    addshape = register_shape

    def getshapes(self):
        return ['arrow', 'blank', 'circle', 'classic', 'square', 'triangle', 'turtle']

    def getcanvas(self):
        return None

    def cv(self):
        return None


TurtleScreen = _Screen


def Screen():
    if _screen[0] is None:
        _screen[0] = _Screen()
    return _screen[0]


def _on_tkey(ev):
    s = _screen[0]
    if s is None:
        return
    ks = ev.get('keysym')
    f = s._keys.get(ks)
    if f is None and ev.get('char'):
        f = s._keys.get(ev.get('char'))
    if f is None:
        f = s._keys.get(None)
    if f is not None and ev.get('k') == 'down':
        f()


def _on_tclick(ev):
    s = _screen[0]
    if s is None:
        return
    x, y = ev.get('x', 0), ev.get('y', 0)
    for t in s._turtles:
        if t._click and t._vis and math.hypot(t._x - x, t._y - y) < 12 * max(t._stretch):
            t._click(x, y)
            return
    f = s._clicks.get(ev.get('b', 1))
    if f is not None:
        f(x, y)


_B.on('tkey', _on_tkey)
_B.on('tclick', _on_tclick)


class Turtle:
    _pen = None

    def __init__(self, shape='classic', undobuffersize=1000, visible=True):
        self.screen = Screen()
        _tid[0] += 1
        self._id = _tid[0]
        self._x = self._y = 0.0
        self._h = 0.0
        self._down = True
        self._pc = 'black'
        self._fc = 'black'
        self._w = 1
        self._speed = 3
        self._vis = bool(visible)
        self._shape = shape
        self._stretch = (1, 1)
        self._filling = False
        self._fpts = []
        self._fsegs = []
        self._full = 360.0
        self._click = None
        self._stamps = 0
        self.screen._turtles.append(self)
        self._state()

    # --- службове ---
    def _state(self):
        _emit({'o': 'tur', 't': self._id, 'x': _r(self._x), 'y': _r(self._y), 'h': _r(self._h * 360 / self._full),
               'v': self._vis, 's': self._shape, 'pc': self._pc, 'fc': self._fc, 'z': list(self._stretch), 'w': self._w})

    def _sp(self):
        return 0 if self.screen._tracer == 0 else self._speed

    def _goto(self, x, y):
        x0, y0 = self._x, self._y
        self._x, self._y = float(x), float(y)
        _emit({'o': 'mv', 't': self._id, 'a': [_r(x0), _r(y0), _r(self._x), _r(self._y)], 'p': self._down,
               'c': self._pc, 'w': self._w, 's': self._sp()})
        if self._filling:
            self._fpts.append((_r(self._x), _r(self._y)))
            if self._down:
                self._fsegs.append([_r(x0), _r(y0), _r(self._x), _r(self._y), self._pc, self._w])

    def _turn(self, a):
        self._h = (self._h + a) % self._full
        _emit({'o': 'rot', 't': self._id, 'h': _r(self._h * 360 / self._full), 's': self._sp()})

    def _rad(self):
        return math.radians(self._h * 360 / self._full)

    # --- рух ---
    def forward(self, distance):
        d = float(distance)
        a = self._rad()
        self._goto(self._x + d * math.cos(a), self._y + d * math.sin(a))

    fd = forward

    def back(self, distance):
        self.forward(-float(distance))

    bk = backward = back

    def left(self, angle):
        self._turn(float(angle))

    lt = left

    def right(self, angle):
        self._turn(-float(angle))

    rt = right

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._goto(x, y)

    setpos = setposition = goto

    def teleport(self, x=None, y=None, *, fill_gap=False):
        d = self._down
        self._down = False
        self._goto(self._x if x is None else x, self._y if y is None else y)
        self._down = d

    def setx(self, x):
        self._goto(x, self._y)

    def sety(self, y):
        self._goto(self._x, y)

    def setheading(self, to_angle):
        self._h = float(to_angle) % self._full
        _emit({'o': 'rot', 't': self._id, 'h': _r(self._h * 360 / self._full), 's': self._sp()})

    seth = setheading

    def home(self):
        self._goto(0, 0)
        self.setheading(0)

    def circle(self, radius, extent=None, steps=None):
        radius = float(radius)
        if extent is None:
            extent = self._full
        extent = float(extent)
        if steps is None:
            frac = abs(extent) / self._full
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = 1.0 * extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * math.sin(math.radians(w2 * 360 / self._full))
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        self._turn(w2)
        for _ in range(steps):
            self.forward(l)
            self._turn(w)
        self._turn(-w2)

    def dot(self, size=None, *color):
        if size is None:
            size = max(self._w + 4, 2 * self._w)
        c = self.screen._color(color) if color else self._pc
        _emit({'o': 'dot', 't': self._id, 'x': _r(self._x), 'y': _r(self._y), 'd': float(size), 'c': c, 's': self._sp()})

    def stamp(self):
        self._stamps += 1
        _emit({'o': 'stamp', 't': self._id, 'x': _r(self._x), 'y': _r(self._y), 'h': _r(self._h * 360 / self._full),
               'sh': self._shape, 'pc': self._pc, 'fc': self._fc, 'z': list(self._stretch)})
        return self._stamps

    def clearstamp(self, stampid):
        pass

    def clearstamps(self, n=None):
        pass

    def undo(self):
        pass

    def speed(self, speed=None):
        if speed is None:
            return self._speed
        if isinstance(speed, str):
            speed = _SPEEDS.get(speed, 6)
        speed = float(speed)
        self._speed = 0 if (speed > 10 or speed < 0.5) else int(round(speed))

    # --- стан ---
    def position(self):
        return Vec2D(self._x, self._y)

    pos = position

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def heading(self):
        return self._h

    def towards(self, x, y=None):
        if y is None:
            x, y = x
        a = math.degrees(math.atan2(y - self._y, x - self._x)) % 360
        return a * self._full / 360

    def distance(self, x, y=None):
        if y is None:
            if isinstance(x, Turtle):
                x, y = x._x, x._y
            else:
                x, y = x
        return math.hypot(x - self._x, y - self._y)

    def degrees(self, fullcircle=360.0):
        self._h = self._h * fullcircle / self._full
        self._full = float(fullcircle)

    def radians(self):
        self.degrees(2 * math.pi)

    # --- перо ---
    def pendown(self):
        self._down = True

    pd = down = pendown

    def penup(self):
        self._down = False

    pu = up = penup

    def isdown(self):
        return self._down

    def pensize(self, width=None):
        if width is None:
            return self._w
        self._w = float(width)
        self._state()

    width = pensize

    def pencolor(self, *args):
        if not args:
            return self._pc
        self._pc = self.screen._color(args)
        self._state()

    def fillcolor(self, *args):
        if not args:
            return self._fc
        self._fc = self.screen._color(args)
        self._state()

    def color(self, *args):
        if not args:
            return (self._pc, self._fc)
        if len(args) == 1:
            self._pc = self._fc = self.screen._color(args)
        elif len(args) == 2:
            self._pc = self.screen._color((args[0],))
            self._fc = self.screen._color((args[1],))
        elif len(args) == 3:
            self._pc = self._fc = self.screen._color(args)
        self._state()

    def pen(self, pen=None, **pendict):
        d = {'shown': self._vis, 'pendown': self._down, 'pencolor': self._pc, 'fillcolor': self._fc,
             'pensize': self._w, 'speed': self._speed}
        if pen is None and not pendict:
            return d
        d2 = dict(pen or {}, **pendict)
        if 'pencolor' in d2:
            self.pencolor(d2['pencolor'])
        if 'fillcolor' in d2:
            self.fillcolor(d2['fillcolor'])
        if 'pensize' in d2:
            self.pensize(d2['pensize'])
        if 'pendown' in d2:
            self._down = bool(d2['pendown'])
        if 'speed' in d2:
            self.speed(d2['speed'])
        if 'shown' in d2:
            self._vis = bool(d2['shown'])
            self._state()

    def begin_fill(self):
        self._filling = True
        self._fpts = [(_r(self._x), _r(self._y))]
        self._fsegs = []

    def end_fill(self):
        if self._filling and len(self._fpts) > 2:
            _emit({'o': 'fill', 't': self._id, 'p': self._fpts, 'c': self._fc, 'g': self._fsegs})
        self._filling = False
        self._fpts = []
        self._fsegs = []

    def filling(self):
        return self._filling

    def clear(self):
        _emit({'o': 'clear', 't': self._id})

    def reset(self):
        self._x = self._y = 0.0
        self._h = 0.0
        self._down = True
        self._pc = self._fc = 'black'
        self._w = 1
        self._filling = False
        _emit({'o': 'clear', 't': self._id})
        self._state()

    def write(self, arg, move=False, align='left', font=('Arial', 8, 'normal')):
        f = _B.font(font)
        _emit({'o': 'text', 't': self._id, 'x': _r(self._x), 'y': _r(self._y), 'txt': str(arg), 'a': str(align),
               'f': f['css'], 'c': self._pc, 's': self._sp()})
        if move:
            self._x += len(str(arg)) * f['px'] * 0.6

    # --- вигляд черепашки ---
    def showturtle(self):
        self._vis = True
        self._state()

    st = showturtle

    def hideturtle(self):
        self._vis = False
        self._state()

    ht = hideturtle

    def isvisible(self):
        return self._vis

    def shape(self, name=None):
        if name is None:
            return self._shape
        if name not in self.screen.getshapes():
            raise TurtleGraphicsError('There is no shape named %s' % name)
        self._shape = name
        self._state()

    def shapesize(self, stretch_wid=None, stretch_len=None, outline=None):
        if stretch_wid is None and stretch_len is None:
            return self._stretch
        if stretch_len is None:
            stretch_len = stretch_wid
        self._stretch = (float(stretch_wid), float(stretch_len))
        self._state()

    turtlesize = shapesize

    def tilt(self, angle):
        pass

    def settiltangle(self, angle):
        pass

    def onclick(self, fun, btn=1, add=None):
        self._click = fun

    def onrelease(self, fun, btn=1, add=None):
        pass

    def ondrag(self, fun, btn=1, add=None):
        pass

    def getscreen(self):
        return self.screen

    def getturtle(self):
        return self

    getpen = getturtle

    def clone(self):
        t = Turtle(self._shape, visible=self._vis)
        t._x, t._y, t._h = self._x, self._y, self._h
        t._down, t._pc, t._fc, t._w, t._speed, t._stretch = self._down, self._pc, self._fc, self._w, self._speed, self._stretch
        t._state()
        return t


RawTurtle = RawPen = Pen = Turtle


def _getpen():
    if _pen[0] is None or _pen[0] not in Screen()._turtles:
        _pen[0] = Turtle()
    return _pen[0]


def _mk_t(name):
    def f(*args, **kw):
        return getattr(_getpen(), name)(*args, **kw)
    f.__name__ = name
    return f


def _mk_s(name):
    def f(*args, **kw):
        return getattr(Screen(), name)(*args, **kw)
    f.__name__ = name
    return f


for _n in ['forward', 'fd', 'back', 'bk', 'backward', 'left', 'lt', 'right', 'rt', 'goto', 'setpos', 'setposition',
           'setx', 'sety', 'setheading', 'seth', 'home', 'circle', 'dot', 'stamp', 'speed', 'position', 'pos',
           'xcor', 'ycor', 'heading', 'towards', 'distance', 'pendown', 'pd', 'down', 'penup', 'pu', 'up',
           'pensize', 'width', 'pencolor', 'fillcolor', 'color', 'begin_fill', 'end_fill', 'filling', 'isdown',
           'clear', 'reset', 'write', 'showturtle', 'st', 'hideturtle', 'ht', 'isvisible', 'shape', 'shapesize',
           'turtlesize', 'degrees', 'radians', 'clearstamps', 'clearstamp', 'undo', 'teleport', 'tilt',
           'settiltangle', 'onclick', 'onrelease', 'ondrag', 'getscreen', 'getturtle', 'getpen', 'clone', 'pen']:
    globals()[_n] = _mk_t(_n)

for _n in ['bgcolor', 'title', 'setup', 'screensize', 'tracer', 'update', 'delay', 'onkey', 'onkeypress',
           'onkeyrelease', 'listen', 'onscreenclick', 'ontimer', 'mainloop', 'done', 'exitonclick', 'bye',
           'window_width', 'window_height', 'colormode', 'clearscreen', 'resetscreen', 'turtles', 'textinput',
           'numinput', 'bgpic', 'register_shape', 'addshape', 'getshapes', 'mode', 'getcanvas']:
    globals()[_n] = _mk_s(_n)

# у модулі turtle onclick без об'єкта стосується черепашки, а clear/reset — теж черепашки
del _n
