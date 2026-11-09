"""tkinter.font для браузера."""
NORMAL, BOLD, ITALIC, ROMAN = 'normal', 'bold', 'italic', 'roman'


class Font:
    def __init__(self, root=None, font=None, name=None, exists=False, **options):
        self.family = options.get('family', 'Segoe UI')
        self.size = options.get('size', 9)
        self.weight = options.get('weight', 'normal')
        self.slant = options.get('slant', 'roman')
        self.underline = options.get('underline', 0)
        self.overstrike = options.get('overstrike', 0)

    def _lp_font(self):
        st = [self.weight] + (['italic'] if self.slant == 'italic' else []) + (['underline'] if self.underline else [])
        return (self.family, self.size, ' '.join(st))

    def configure(self, **options):
        for k, v in options.items():
            setattr(self, k, v)

    config = configure

    def cget(self, option):
        return getattr(self, option)

    def actual(self, option=None):
        d = {'family': self.family, 'size': self.size, 'weight': self.weight, 'slant': self.slant}
        return d[option] if option else d

    def measure(self, text, displayof=None):
        return int(len(str(text)) * abs(self.size) * 0.75)

    def metrics(self, *options):
        return int(abs(self.size) * 1.6)


def families(root=None, displayof=None):
    return ('Arial', 'Courier New', 'Segoe UI', 'Times New Roman', 'Verdana', 'Comic Sans MS')


def nametofont(name, root=None):
    return Font()
