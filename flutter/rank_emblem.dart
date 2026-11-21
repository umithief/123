// Motonom rütbe amblemleri: kariyer yolundaki 7 kademe için hareketli armalar.
// Kademe yükseldikçe biçim, malzeme ve hareket zenginleşir:
// çelik disk → bronz kalkan → gümüş altıgen → altın kalkan → platin yıldız → obsidyen yıldız → beyaz altın güneş.
// Tek dosya, yalnızca Flutter SDK kullanır.
//
// Kullanım:
//   RankEmblem(tier: rankEmblemTierForApex(13656), size: 180)          // 5 = Kademe Ustası
//   RankEmblem(tier: 7, size: 180, accent: const Color(0xFF1F4BFF))
//
// Huzmeler, kanatlar ve alevler kutunun %15 dışına taşabilir; etrafında boşluk bırak.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

class RankEmblemInfo {
  const RankEmblemInfo(this.tier, this.name, this.minApex);
  final int tier;
  final String name;
  final int minApex;
}

const List<RankEmblemInfo> rankEmblems = [
  RankEmblemInfo(1, 'Çaylak Sürücü', 0),
  RankEmblemInfo(2, 'Sokak Pilotu', 500),
  RankEmblemInfo(3, 'Asfalt Kâşifi', 2000),
  RankEmblemInfo(4, 'Rota Komutanı', 5000),
  RankEmblemInfo(5, 'Kademe Ustası', 12000),
  RankEmblemInfo(6, 'Elit Sürücü', 20000),
  RankEmblemInfo(7, 'Efsane Sürücü', 35000),
];

/// Verilen Apex puanının hak ettiği kademe (1-7).
int rankEmblemTierForApex(int apex) {
  var tier = 1;
  for (final e in rankEmblems) {
    if (apex >= e.minApex) tier = e.tier;
  }
  return tier;
}

class RankEmblem extends StatefulWidget {
  const RankEmblem({super.key, required this.tier, this.size = 160, this.accent = const Color(0xFF1F4BFF)});

  /// 1 (Çaylak Sürücü) - 7 (Efsane Sürücü)
  final int tier;
  final double size;

  /// Mine, hale ve alevlerdeki mavi tonların kaynağı.
  final Color accent;

  @override
  State<RankEmblem> createState() => _RankEmblemState();
}

class _RankEmblemState extends State<RankEmblem> with TickerProviderStateMixin {
  late final _EmblemScene _scene = _EmblemScene(math.Random(widget.tier * 7919 + 31));
  final ValueNotifier<int> _frame = ValueNotifier<int>(0);
  Ticker? _ticker;
  Duration _last = Duration.zero;

  int get _tier => widget.tier.clamp(1, 7);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduced = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (reduced) {
      _ticker?.dispose();
      _ticker = null;
      if (_scene.t == 0) {
        for (var i = 0; i < 100; i++) {
          _scene.step(1 / 30, _tier);
        }
      }
    } else if (_ticker == null) {
      _last = Duration.zero;
      _ticker = createTicker(_onTick)..start();
    }
  }

  void _onTick(Duration elapsed) {
    var dt = (elapsed - _last).inMicroseconds / 1e6;
    _last = elapsed;
    if (dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    _scene.step(dt, _tier);
    _frame.value++;
  }

  @override
  void dispose() {
    _ticker?.dispose();
    _frame.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.size;
    return SizedBox(
      width: s,
      height: s,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: -0.15 * s,
            top: -0.15 * s,
            width: 1.3 * s,
            height: 1.3 * s,
            child: IgnorePointer(
              child: RepaintBoundary(
                child: CustomPaint(
                  painter: _EmblemPainter(scene: _scene, tier: _tier, accent: _Rgb.ofColor(widget.accent), repaint: _frame),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- RENK VE GEOMETRİ YARDIMCILARI ---

const double _tau = math.pi * 2;
const double _deg = math.pi / 180;

double _clamp01(double v) => v < 0 ? 0.0 : (v > 1 ? 1.0 : v);
double _lerp(double a, double b, double k) => a + (b - a) * k;
double _pow(double a, double b) => math.pow(a, b).toDouble();

class _Rgb {
  const _Rgb(this.r, this.g, this.b);
  _Rgb.hex(int v)
      : r = ((v >> 16) & 255).toDouble(),
        g = ((v >> 8) & 255).toDouble(),
        b = (v & 255).toDouble();
  _Rgb.ofColor(Color c)
      : r = ((c.toARGB32() >> 16) & 255).toDouble(),
        g = ((c.toARGB32() >> 8) & 255).toDouble(),
        b = (c.toARGB32() & 255).toDouble();

  final double r, g, b;

  Color a(double alpha) => Color.fromARGB((_clamp01(alpha) * 255).round(), r.round(), g.round(), b.round());
  _Rgb mix(_Rgb o, double k) => _Rgb(_lerp(r, o.r, k), _lerp(g, o.g, k), _lerp(b, o.b, k));
}

const _white = _Rgb(255, 255, 255);
const _black = _Rgb(0, 0, 0);
const _goldC = _Rgb(255, 205, 90);

const _steel = [0x3A4048, 0x8D96A1, 0xD7DDE4, 0x5D6570, 0x2C3138];
const _bronze = [0x4D2B10, 0xB97A3E, 0xF1C48C, 0x94592A, 0x5E3615];
const _silver = [0x6F7780, 0xE6EBF0, 0xFFFFFF, 0xAAB3BD, 0x78818B];
const _gold = [0x7A5412, 0xF3D572, 0xFFF7D1, 0xD9A733, 0x8C6315];
const _platinum = [0x8A919A, 0xF2F5F8, 0xFFFFFF, 0xC6CED7, 0x959DA6];
const _obsidian = [0x08090C, 0x3A3F4A, 0x8E98A6, 0x1B1E25, 0x050607];
const _whiteGold = [0xC9A24A, 0xFFF1C4, 0xFFFFFF, 0xF3D98A, 0xD6B25A];
const _roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const _bodyR = [0.0, 46.0, 52.0, 56.0, 60.0, 66.0, 70.0, 72.0];

Color _hex(int v, [double alpha = 1]) => _Rgb.hex(v).a(alpha);

List<Offset> _polyPts(int n, double r, [double rot = -math.pi / 2]) =>
    List.generate(n, (i) {
      final a = rot + i / n * _tau;
      return Offset(r * math.cos(a), r * math.sin(a));
    });

List<Offset> _starPts(int n, double ro, double ri, [double rot = -math.pi / 2]) =>
    List.generate(n * 2, (i) {
      final a = rot + i / (n * 2) * _tau, r = i.isOdd ? ri : ro;
      return Offset(r * math.cos(a), r * math.sin(a));
    });

/// Klasik arma kalkanı: düz üst kenar, kavisle sivri alta iner.
List<Offset> _shieldPts(double w, double h) {
  final right = <Offset>[];
  for (var i = 0; i <= 10; i++) {
    final k = i / 10, u = 1 - k;
    right.add(Offset(u * u * w + 2 * u * k * w * 1.02, u * u * (-0.6 * h) + 2 * u * k * (0.3 * h) + k * k * h));
  }
  final top = [Offset(-w * 0.4, -0.6 * h), Offset(0, -0.7 * h), Offset(w * 0.4, -0.6 * h)];
  final left = right.sublist(0, right.length - 1).reversed.map((p) => Offset(-p.dx, p.dy)).toList();
  return [...top, ...right, ...left];
}

Path _path(List<Offset> pts) => Path()..addPolygon(pts, true);

List<Offset> _scalePts(List<Offset> pts, double k, [double dy = 0]) => pts.map((p) => Offset(p.dx * k, p.dy * k + dy)).toList();

Shader _metal(List<int> stops, double angle, int repeat, [double radius = 90]) {
  final colors = <Color>[];
  final pos = <double>[];
  final n = stops.length;
  for (var r = 0; r < repeat; r++) {
    for (var i = 0; i < n; i++) {
      colors.add(_hex(stops[i]));
      pos.add((r + i / n) / repeat);
    }
  }
  colors.add(_hex(stops[0]));
  pos.add(1);
  return SweepGradient(colors: colors, stops: pos, transform: GradientRotation(angle))
      .createShader(Rect.fromCircle(center: Offset.zero, radius: radius));
}

Paint _stroke(Color c, double w, {StrokeCap cap = StrokeCap.round}) => Paint()
  ..style = PaintingStyle.stroke
  ..color = c
  ..strokeWidth = w
  ..strokeCap = cap
  ..strokeJoin = StrokeJoin.round;

Paint _fill(Color c) => Paint()..color = c;

void _bloom(Canvas canvas, Offset c, double r, _Rgb col, double a) {
  if (a <= 0 || r <= 0) return;
  canvas.drawCircle(
    c,
    r,
    Paint()
      ..shader = RadialGradient(
        colors: [col.mix(_white, 0.7).a(a), col.a(a * 0.55), col.a(0)],
        stops: const [0, 0.35, 1],
      ).createShader(Rect.fromCircle(center: c, radius: r)),
  );
}

void _star(Canvas canvas, Offset c, double size, double rot, double alpha) {
  if (size <= 0 || alpha <= 0) return;
  final pts = List.generate(8, (i) {
    final r = i.isOdd ? size * 0.16 : size * (i % 4 != 0 ? 0.6 : 1.0);
    final a = rot + i / 8 * _tau;
    return c + Offset(r * math.cos(a), r * math.sin(a));
  });
  canvas.drawPath(_path(pts), _fill(_white.a(alpha)));
}

void _dashedPolyline(Canvas canvas, List<Offset> pts, double dash, double gap, double offset, Paint paint) {
  final period = dash + gap;
  var pos = ((offset % period) + period) % period;
  for (var i = 1; i < pts.length; i++) {
    final a = pts[i - 1], b = pts[i];
    final len = (b - a).distance;
    if (len == 0) continue;
    var d = 0.0;
    while (d < len) {
      final inDash = pos < dash;
      final remain = inDash ? dash - pos : period - pos;
      final stepLen = math.min(remain, len - d);
      if (inDash) canvas.drawLine(Offset.lerp(a, b, d / len)!, Offset.lerp(a, b, (d + stepLen) / len)!, paint);
      d += stepLen;
      pos = (pos + stepLen) % period;
    }
  }
}

// Yazılar her karede yeniden dizilmesin diye önbellekte tutulur (az sayıda sabit etiket var)
final Map<String, TextPainter> _textCache = {};

void _text(Canvas canvas, String s, Offset center, double size, Color color, {String? family}) {
  final key = '$s|$size|${color.toARGB32()}|$family';
  final tp = _textCache.putIfAbsent(
    key,
    () => TextPainter(
      text: TextSpan(text: s, style: TextStyle(fontSize: size, fontWeight: FontWeight.w900, color: color, fontFamily: family, height: 1)),
      textDirection: TextDirection.ltr,
    )..layout(),
  );
  tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
}

// --- SAHNE DURUMU ---

class _Mote {
  _Mote(this.x, this.y, this.vx, this.vy, this.life, this.size) : max = life;
  double x, y, vx, vy, life;
  final double max, size;
}

class _Glint {
  _Glint(this.pos, this.life, this.size);
  final Offset pos;
  final double life, size;
  double age = 0;
}

class _EmblemScene {
  _EmblemScene(this.rnd) {
    for (var i = 0; i < 22; i++) {
      final a = rnd.nextDouble() * _tau, r = rnd.nextDouble() * 36;
      stars.add([r * math.cos(a), r * math.sin(a), rnd.nextDouble() * _tau]);
    }
  }

  final math.Random rnd;
  final List<List<double>> stars = [];
  final List<_Mote> motes = [];
  final List<_Glint> glints = [];
  double t = 0, acc = 0, nextGlint = 0.6, shock = 9;

  static const _moteRate = [0.0, 0.0, 0.0, 0.0, 2.0, 5.0, 9.0, 16.0];
  static const _glintEvery = [0.0, 0.0, 0.0, 2.2, 1.4, 0.9, 0.6, 0.35];

  void step(double dt, int tier) {
    t += dt;
    final r0 = _bodyR[tier];
    acc += dt * _moteRate[tier];
    while (acc >= 1) {
      acc -= 1;
      final a = rnd.nextDouble() * _tau, r = r0 + rnd.nextDouble() * 10;
      motes.add(_Mote(r * math.cos(a), r * math.sin(a), (rnd.nextDouble() - 0.5) * 12, -10 - rnd.nextDouble() * 24, 1.3 + rnd.nextDouble() * 1.2, 0.6 + rnd.nextDouble() * 1.1));
    }
    for (final m in motes) {
      m.x += (m.vx + 5 * math.sin(m.life * 4)) * dt;
      m.y += m.vy * dt;
      m.life -= dt;
    }
    motes.removeWhere((m) => m.life <= 0);
    final every = _glintEvery[tier];
    if (every > 0) {
      nextGlint -= dt;
      if (nextGlint <= 0) {
        nextGlint = every * (0.6 + rnd.nextDouble() * 0.8);
        final a = rnd.nextDouble() * _tau, r = r0 * (0.55 + rnd.nextDouble() * 0.45);
        glints.add(_Glint(Offset(r * math.cos(a), r * math.sin(a)), 0.55 + rnd.nextDouble() * 0.4, 5 + rnd.nextDouble() * (tier >= 6 ? 8 : 5)));
      }
    }
    for (final g in glints) {
      g.age += dt;
    }
    glints.removeWhere((g) => g.age >= g.life);
    if (tier == 7) {
      shock += dt / 0.9;
      if (shock > 5.5) shock = 0;
    }
  }
}

// --- ÇİZİM ---

class _EmblemPainter extends CustomPainter {
  _EmblemPainter({required this.scene, required this.tier, required this.accent, required Listenable repaint}) : super(repaint: repaint);

  final _EmblemScene scene;
  final int tier;
  final _Rgb accent;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 260;
    // Alt kademeler kutuda küçük kalmasın
    const tierScale = [1.0, 1.22, 1.15, 1.08, 1.0, 1.0, 1.0, 1.0];
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.scale(k * tierScale[tier], k * tierScale[tier]);
    _draw(canvas);
    canvas.restore();
  }

  // Fasetli metal gövde: her kenar merkezle bir üçgen yüz oluşturur, yüz ışığa göre aydınlanır ya da gölgelenir
  void _facetBody(Canvas canvas, List<Offset> pts, List<int> stops, double light, [double depth = 1]) {
    final t = scene.t;
    final body = _path(pts);
    canvas.drawPath(body, Paint()..shader = _metal(stops, t * 0.3, 2));
    for (var i = 0; i < pts.length; i++) {
      final a = pts[i], b = pts[(i + 1) % pts.length];
      var nx = b.dy - a.dy, ny = -(b.dx - a.dx);
      if (nx * (a.dx + b.dx) + ny * (a.dy + b.dy) < 0) {
        nx = -nx;
        ny = -ny;
      }
      final shade = math.cos(math.atan2(ny, nx) - light) * depth;
      final c = shade > 0 ? _white.a(0.34 * shade) : _black.a(0.42 * -shade);
      canvas.drawPath(_path([Offset.zero, a, b]), _fill(c));
    }
    canvas.drawPath(body, _stroke(_black.a(0.5), 0.9));
    canvas.drawPath(_path(_scalePts(pts, 0.97)), _stroke(_white.a(0.28), 0.6));
  }

  void _enamel(Canvas canvas, List<Offset> pts, Color c0, Color c1) {
    final p = _path(pts);
    canvas.drawPath(
      p,
      Paint()
        ..shader = RadialGradient(center: const Alignment(-0.17, -0.23), radius: 0.5, colors: [c0, c1])
            .createShader(Rect.fromCircle(center: Offset.zero, radius: 60)),
    );
    canvas.drawPath(p, _stroke(_black.a(0.55), 1.4));
  }

  void _gloss(Canvas canvas, double r) {
    final rect = Rect.fromCenter(center: Offset(0, -r * 0.42), width: r * 1.56, height: r);
    final path = Path()
      ..addArc(rect, math.pi, math.pi)
      ..close();
    canvas.drawPath(
      path,
      Paint()
        ..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_white.a(0.22), _white.a(0)])
            .createShader(Rect.fromLTWH(-r, -r, 2 * r, r)),
    );
  }

  void _ringMetal(Canvas canvas, double r0, double r1, List<int> stops, double angle) {
    final ring = Path()
      ..fillType = PathFillType.evenOdd
      ..addOval(Rect.fromCircle(center: Offset.zero, radius: r1))
      ..addOval(Rect.fromCircle(center: Offset.zero, radius: r0));
    canvas.drawPath(ring, Paint()..shader = _metal(stops, angle, 3));
    canvas.drawCircle(Offset.zero, r0, _stroke(_black.a(0.45), 0.7));
    canvas.drawCircle(Offset.zero, r1 - 0.4, _stroke(_white.a(0.35), 0.7));
  }

  void _gem(Canvas canvas, Offset c, double size, double rot, Color light, Color dark, Color setting) {
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(rot);
    List<Offset> d(double r) => [Offset(-r, 0), Offset(0, -r), Offset(r, 0), Offset(0, r)];
    canvas.drawPath(_path(d(size + 1.2)), _fill(setting));
    canvas.drawPath(_path(d(size)), _fill(dark));
    canvas.drawPath(_path([Offset(-size, 0), Offset(0, -size), Offset(size, 0)]), _fill(light));
    canvas.drawPath(_path([Offset(-size * 0.5, -size * 0.1), Offset(0, -size * 0.7), Offset(size * 0.1, -size * 0.1)]), _fill(_white.a(0.85)));
    canvas.restore();
  }

  // Alt şerit ve Roma rakamı
  void _ribbon(Canvas canvas, double y, double w, String label, List<int> stops, Color ink) {
    for (final side in [-1.0, 1.0]) {
      final tail = _path([
        Offset(side * (w - 3), y - 3),
        Offset(side * (w + 9), y - 3),
        Offset(side * (w + 5), y + 3.5),
        Offset(side * (w + 9), y + 10),
        Offset(side * (w - 3), y + 10),
      ]);
      canvas.drawPath(tail, _fill(_hex(stops[4])));
      canvas.drawPath(tail, _stroke(_black.a(0.4), 0.6));
    }
    final band = Path()
      ..moveTo(-w, y - 6.5)
      ..quadraticBezierTo(0, y - 9.5, w, y - 6.5)
      ..lineTo(w, y + 6.5)
      ..quadraticBezierTo(0, y + 3.5, -w, y + 6.5)
      ..close();
    canvas.drawPath(
      band,
      Paint()
        ..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_hex(stops[2]), _hex(stops[1]), _hex(stops[0])])
            .createShader(Rect.fromLTWH(-w, y - 7, 2 * w, 14)),
    );
    canvas.drawPath(band, _stroke(_black.a(0.5), 0.8));
    _text(canvas, label, Offset(0, y - 0.6), 9, ink, family: 'serif');
  }

  // --- SEMBOLLER ---
  void _iconBike(Canvas canvas, Color color) {
    final t = scene.t;
    for (final x in [-10.0, 10.0]) {
      canvas.save();
      canvas.translate(x, 5);
      canvas.rotate(t * 2);
      canvas.drawCircle(Offset.zero, 6, _stroke(color, 2.6));
      canvas.drawLine(const Offset(-6, 0), const Offset(6, 0), _stroke(color, 0.8));
      canvas.drawLine(const Offset(0, -6), const Offset(0, 6), _stroke(color, 0.8));
      canvas.restore();
    }
    final p = _stroke(color, 2.6);
    canvas.drawPath(Path()..addPolygon(const [Offset(-10, 5), Offset(-2, -5), Offset(7, -5), Offset(10, 5)], false), p);
    canvas.drawLine(const Offset(-2, -5), const Offset(2, 4), p);
    canvas.drawPath(Path()..addPolygon(const [Offset(5, -5), Offset(9, -11), Offset(12, -11)], false), p);
  }

  void _iconTrend(Canvas canvas, Color color) {
    final p = _stroke(color, 3.2);
    canvas.drawPath(Path()..addPolygon(const [Offset(-13, 9), Offset(-4, -1), Offset(2, 5), Offset(12, -7)], false), p);
    canvas.drawPath(Path()..addPolygon(const [Offset(4, -7), Offset(12, -7), Offset(12, 1)], false), p);
  }

  void _iconCompass(Canvas canvas, Color color, double needle) {
    canvas.drawCircle(Offset.zero, 13, _stroke(color, 2.4));
    canvas.save();
    canvas.rotate(needle);
    canvas.drawPath(_path(const [Offset(0, -10), Offset(3.4, 0), Offset(-3.4, 0)]), _fill(accent.mix(_white, 0.2).a(1)));
    canvas.drawPath(_path(const [Offset(0, 10), Offset(3.4, 0), Offset(-3.4, 0)]), _fill(color));
    canvas.restore();
    canvas.drawCircle(Offset.zero, 1.3, _fill(Colors.white));
  }

  void _iconNavigate(Canvas canvas, Color color) {
    canvas.drawPath(_path(const [Offset(0, -14), Offset(10.5, 12), Offset(0, 6), Offset(-10.5, 12)]), _stroke(color, 2.8));
  }

  void _iconMedal(Canvas canvas, Color color) {
    final p = _stroke(color, 2.6);
    canvas.drawLine(const Offset(-8, -13), const Offset(-3, -1), p);
    canvas.drawLine(const Offset(8, -13), const Offset(3, -1), p);
    canvas.drawLine(const Offset(-8, -13), const Offset(8, -13), p);
    canvas.drawCircle(const Offset(0, 6), 7.5, p);
    _text(canvas, '5', const Offset(0, 6.6), 8, color);
  }

  void _iconGauge(Canvas canvas, Color color, double needle, Color red) {
    final rect = Rect.fromCircle(center: const Offset(0, 4), radius: 13);
    canvas.drawArc(rect, math.pi * 1.1, math.pi * 0.8 - 0.25, false, _stroke(color, 2.6));
    canvas.drawArc(rect, math.pi * 1.9 - 0.22, 0.22, false, _stroke(red, 2.6));
    final tick = _stroke(color, 1.2);
    for (var i = 0; i <= 6; i++) {
      final a = math.pi * 1.1 + i / 6 * math.pi * 0.8;
      canvas.drawLine(Offset(8 * math.cos(a), 4 + 8 * math.sin(a)), Offset(10 * math.cos(a), 4 + 10 * math.sin(a)), tick);
    }
    final a = math.pi * 1.1 + needle * math.pi * 0.8;
    canvas.drawLine(const Offset(0, 4), Offset(11 * math.cos(a), 4 + 11 * math.sin(a)), _stroke(needle > 0.85 ? red : Colors.white, 2.2));
    canvas.drawCircle(const Offset(0, 4), 2.4, _fill(color));
  }

  void _iconAward(Canvas canvas, Color color) {
    final p = _stroke(color, 2.6);
    canvas.drawCircle(const Offset(0, -4), 8.5, p);
    canvas.drawPath(Path()..addPolygon(const [Offset(-5, 3), Offset(-7.5, 14), Offset(0, 10.5), Offset(7.5, 14), Offset(5, 3)], false), p);
    canvas.drawCircle(const Offset(0, -4), 3, _fill(color));
  }

  // --- SÜSLER ---
  void _wings(Canvas canvas, double ax, double ay, double scale, int layers, List<int> stops, Color tip, Color outline) {
    final t = scene.t;
    const spec = [
      [8.0, 70.0, -60.0, 18.0, 0.24],
      [7.0, 52.0, -54.0, 12.0, 0.1],
      [6.0, 38.0, -48.0, 8.0, 0.0],
    ];
    for (final side in [1.0, -1.0]) {
      canvas.save();
      canvas.scale(side, 1);
      canvas.translate(ax, ay);
      for (var li = 0; li < layers; li++) {
        final sp = spec[3 - layers + li];
        final n = sp[0].toInt();
        for (var i = n - 1; i >= 0; i--) {
          final k = i / (n - 1);
          final ang = _lerp(sp[2], sp[3], k) * _deg * (1 + 0.04 * math.sin(t * 1.3)) + 0.02 * math.sin(t * 1.3 + i * 0.6);
          final len = sp[1] * scale * (1 - 0.45 * _pow(k, 1.5)), w = len * 0.17;
          canvas.save();
          canvas.rotate(ang);
          final feather = Path()
            ..moveTo(0, 0)
            ..cubicTo(len * 0.3, -w, len * 0.8, -w * 0.9, len, 0)
            ..cubicTo(len * 0.75, w * 0.5, len * 0.3, w * 0.6, 0, 0)
            ..close();
          canvas.drawPath(
            feather,
            Paint()
              ..shader = LinearGradient(colors: [_hex(stops[0]), _hex(stops[1]), _hex(stops[2]), tip], stops: const [0, 0.35, 0.7, 1])
                  .createShader(Rect.fromLTWH(0, -w, len, 2 * w)),
          );
          if (sp[4] > 0) canvas.drawPath(feather, _fill(_black.a(sp[4])));
          final sh = _pow(math.max(0.0, math.sin(t * 2.2 - i * 0.55 - li)), 8);
          if (sh > 0.02) canvas.drawPath(feather, _fill(_white.a(0.5 * sh)));
          canvas.drawPath(feather, _stroke(outline, 0.5));
          canvas.restore();
        }
      }
      canvas.restore();
    }
  }

  void _laurel(Canvas canvas, double r, double from, double to) {
    final t = scene.t;
    final leafPaint = Paint()
      ..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFFF1B8), Color(0xFFE2B54A), Color(0xFF8A6115)], stops: [0, 0.45, 1])
          .createShader(const Rect.fromLTWH(-1, -3, 14, 6));
    final rect = Rect.fromCircle(center: Offset.zero, radius: r);
    for (final side in [1.0, -1.0]) {
      if (side == 1) {
        canvas.drawArc(rect, from * _deg, (to - from) * _deg, false, _stroke(const Color(0xE6966C1C), 1.3));
      } else {
        canvas.drawArc(rect, math.pi - from * _deg, (from - to) * _deg, false, _stroke(const Color(0xE6966C1C), 1.3));
      }
      const n = 8;
      for (var i = 0; i < n; i++) {
        final u = i / (n - 1), ang = _lerp(from, to, u) * _deg;
        final x = side * r * math.cos(ang), y = r * math.sin(ang);
        final base = math.atan2(-math.cos(ang), side * math.sin(ang));
        final len = _lerp(11, 6.5, u);
        final dd = (u - (((t * 0.4) % 1.6) - 0.3)) / 0.12;
        final sh = math.exp(-dd * dd);
        for (final k in [1.0, -1.0]) {
          canvas.save();
          canvas.translate(x, y);
          canvas.rotate(base + side * k * 0.6);
          final leaf = Path()
            ..moveTo(0, 0)
            ..quadraticBezierTo(len * 0.45, -len * 0.36, len, 0)
            ..quadraticBezierTo(len * 0.45, len * 0.36, 0, 0)
            ..close();
          canvas.drawPath(leaf, leafPaint);
          if (sh > 0.02) canvas.drawPath(leaf, _fill(_white.a(0.55 * sh)));
          canvas.restore();
        }
      }
    }
  }

  void _rays(Canvas canvas, int n, double r0, double r1, List<_Rgb> cols, double alpha, double speed) {
    final paints = cols
        .map((c) => Paint()
          ..shader = RadialGradient(colors: [c.a(0), c.a(alpha), c.a(0)], stops: [0, r0 / r1, 1])
              .createShader(Rect.fromCircle(center: Offset.zero, radius: r1)))
        .toList();
    canvas.save();
    canvas.rotate(scene.t * speed);
    for (var i = 0; i < n; i++) {
      final a = i / n * _tau, hw = i.isOdd ? 0.05 : 0.085, big = i.isOdd ? r1 * 0.88 : r1;
      canvas.drawPath(
        _path([
          Offset(r0 * math.cos(a - hw * 0.5), r0 * math.sin(a - hw * 0.5)),
          Offset(big * math.cos(a - hw), big * math.sin(a - hw)),
          Offset(big * math.cos(a + hw), big * math.sin(a + hw)),
          Offset(r0 * math.cos(a + hw * 0.5), r0 * math.sin(a + hw * 0.5)),
        ]),
        paints[i % paints.length],
      );
    }
    canvas.restore();
  }

  void _comet(Canvas canvas, double r, double ang, _Rgb col, double len, double w) {
    final rect = Rect.fromCircle(center: Offset.zero, radius: r);
    for (var i = 25; i >= 0; i--) {
      final d0 = i / 26 * len, d1 = (i + 1.15) / 26 * len, k = 1 - i / 26;
      canvas.drawArc(rect, ang - d1, d1 - d0, false, _stroke(col.mix(_white, 0.5 * k * k).a(k * k), w * (0.3 + 0.7 * k), cap: StrokeCap.butt));
    }
    _bloom(canvas, Offset(r * math.cos(ang), r * math.sin(ang)), w * 3.2, col, 0.95);
  }

  void _flames(Canvas canvas, double r0, _Rgb inner, _Rgb outer) {
    final t = scene.t;
    const n = 26;
    final layers = [
      [1.0, outer, const _Rgb(255, 190, 80), 0.0],
      [0.6, inner, const _Rgb(255, 245, 220), 1.7],
    ];
    for (final layer in layers) {
      final scale = layer[0] as double, c0 = layer[1] as _Rgb, c1 = layer[2] as _Rgb, ph = layer[3] as double;
      final outerR = r0 + 26 * scale;
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [c0.a(0), c0.a(1), c0.mix(c1, 0.5).a(0.9), c1.a(0)],
          stops: [0, (r0 - 2) / outerR, (r0 - 2 + 0.55 * (outerR - r0 + 2)) / outerR, 1],
        ).createShader(Rect.fromCircle(center: Offset.zero, radius: outerR));
      for (var i = 0; i < n; i++) {
        final a = i / n * _tau + ph * 0.1;
        final nn = 0.5 + 0.25 * math.sin(t * 5.1 + i * 2.3 + ph) + 0.25 * math.sin(t * 8.7 + i * 4.1 + ph * 2);
        final h = (9 + 16 * nn) * scale * (0.7 + 0.3 * math.sin(i * 12.9898).abs()) * (0.75 + 0.45 * (0.5 - 0.5 * math.sin(a)));
        final sway = 0.06 * math.sin(t * 4 + i * 1.3), hw = 0.11 * scale;
        Offset p(double r, double an) => Offset(r * math.cos(an), r * math.sin(an));
        final b0 = p(r0 - 2, a - hw), b1 = p(r0 - 2, a + hw), tip = p(r0 + h, a + sway);
        final l = p(r0 + h * 0.45, a - hw * 1.25 + sway * 0.4), rr = p(r0 + h * 0.5, a + hw * 0.9 + sway * 0.6);
        final flame = Path()
          ..moveTo(b0.dx, b0.dy)
          ..quadraticBezierTo(l.dx, l.dy, tip.dx, tip.dy)
          ..quadraticBezierTo(rr.dx, rr.dy, b1.dx, b1.dy)
          ..close();
        canvas.drawPath(flame, paint);
      }
    }
  }

  void _crown(Canvas canvas, double y) {
    final t = scene.t;
    canvas.save();
    canvas.translate(0, y);
    final shape = _path(const [
      Offset(-17, 4), Offset(-19, -12), Offset(-13, -6), Offset(-9.5, -16), Offset(-5, -6.5), Offset(0, -20),
      Offset(5, -6.5), Offset(9.5, -16), Offset(13, -6), Offset(19, -12), Offset(17, 4),
    ]);
    canvas.drawPath(
      shape,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFF6D0), Color(0xFFE9BD4E), Color(0xFF9A6C14)],
          stops: [0, 0.45, 1],
        )
            .createShader(const Rect.fromLTRB(-19, -20, 19, 4)),
    );
    canvas.drawPath(shape, _stroke(const Color(0xD9644208), 0.7));
    canvas.drawRect(const Rect.fromLTWH(-17, 0, 34, 4), _fill(const Color(0x59784F0A)));
    for (final p in const [Offset(-19, -12), Offset(-9.5, -16), Offset(0, -20), Offset(9.5, -16), Offset(19, -12)]) {
      canvas.drawCircle(p, 1.7, _fill(const Color(0xFFFFF3C4)));
      canvas.drawCircle(p, 1.7, _stroke(const Color(0xD9644208), 0.5));
    }
    _bloom(canvas, const Offset(0, -4.5), 9, accent, 0.45 + 0.25 * math.sin(t * 3));
    _gem(canvas, const Offset(0, -4.5), 3.4, 0, accent.mix(_white, 0.45).a(1), accent.mix(_black, 0.3).a(1), const Color(0xFF7A5412));
    canvas.restore();
  }

  void _sweep(Canvas canvas, List<Offset> pts, double cycle, double alpha) {
    final q = (scene.t % cycle) / 1.3;
    if (q >= 1) return;
    canvas.save();
    canvas.clipPath(_path(pts));
    canvas.rotate(-math.pi / 4);
    final x = _lerp(-110, 110, q);
    final rect = Rect.fromLTWH(x - 16, -120, 32, 240);
    canvas.drawRect(rect, Paint()..shader = LinearGradient(colors: [_white.a(0), _white.a(alpha), _white.a(0)]).createShader(rect));
    canvas.restore();
  }

  void _draw(Canvas canvas) {
    final s = scene;
    final t = s.t;
    final light = -3 * math.pi / 4 + (tier >= 3 ? 0.4 * math.sin(t * 0.5) : 0);
    final blue = accent, blueHi = accent.mix(_white, 0.45), blueDeep = accent.mix(_black, 0.7);

    // Arka hale: kademe yükseldikçe güçlenir
    const haloAlpha = [0.0, 0.12, 0.16, 0.22, 0.3, 0.4, 0.5, 0.6];
    final haloR = _bodyR[tier] + 30 + tier * 6;
    final haloC = tier >= 6 ? blue.mix(_goldC, tier == 6 ? 0.6 : 0.25) : blue;
    final ha = haloAlpha[tier] * (0.85 + 0.15 * math.sin(t * 1.6));
    canvas.drawCircle(
      Offset.zero,
      haloR,
      Paint()
        ..shader = RadialGradient(colors: [haloC.a(ha), haloC.a(ha), haloC.a(0)], stops: [0, _bodyR[tier] * 0.6 / haloR, 1])
            .createShader(Rect.fromCircle(center: Offset.zero, radius: haloR)),
    );

    if (tier >= 4) {
      _rays(
        canvas,
        tier == 4 ? 8 : (tier == 5 ? 12 : 18),
        _bodyR[tier] - 8,
        tier == 7 ? 128.0 : (tier == 6 ? 122.0 : 108.0),
        tier == 7 ? [_goldC, blueHi] : (tier == 6 ? [_goldC] : [blueHi]),
        tier == 4 ? 0.22 : (tier == 5 ? 0.3 : 0.5),
        tier == 7 ? 0.12 : 0.07,
      );
    }
    for (final m in s.motes) {
      final k = _clamp01(m.life / m.max);
      canvas.drawCircle(Offset(m.x, m.y), m.size * (0.5 + 0.5 * k), _fill((tier == 7 ? blueHi : _goldC).mix(_white, 0.3 * k).a(math.min(1.0, k * 1.5) * 0.9)));
    }
    if (tier == 5) _wings(canvas, 44, 8, 0.85, 2, _silver, blueHi.a(1), const Color(0x99283240));
    if (tier == 6) _wings(canvas, 46, 10, 1, 3, _gold, const Color(0xFFF3D572), const Color(0x99462D05));
    if (tier == 7) _wings(canvas, 48, 10, 1.12, 3, _whiteGold, blueHi.a(1), const Color(0x8C6E460A));
    if (tier == 7) _flames(canvas, 72, const _Rgb(200, 230, 255), blue);
    if (tier == 4) _laurel(canvas, 60, 70, -40);

    // Gövde
    late List<Offset> body;
    switch (tier) {
      case 1: {
        body = _polyPts(48, 46);
        _ringMetal(canvas, 38, 46, _steel, t * 0.2);
        _enamel(canvas, _polyPts(48, 38), const Color(0xFF2A3140), const Color(0xFF0E1218));
        _gloss(canvas, 38);
        _iconBike(canvas, const Color(0xFFD7DDE4));
      }
      case 2: {
        body = _shieldPts(44, 58);
        _facetBody(canvas, body, _bronze, light, 0.9);
        final inner = _scalePts(body, 0.78, 1);
        _enamel(canvas, inner, const Color(0xFF3A2414), const Color(0xFF120A05));
        canvas.save();
        canvas.clipPath(_path(inner));
        _dashedPolyline(canvas, const [Offset(0, -60), Offset(0, 60)], 5, 6, -t * 14, _stroke(const Color(0x59F1C48C), 1.6, cap: StrokeCap.butt));
        _gloss(canvas, 40);
        canvas.restore();
        final chev = _stroke(const Color(0xFFF1C48C), 2.4);
        for (final dy in [-29.0, -24.0]) {
          canvas.drawPath(Path()..addPolygon([Offset(-8, dy + 3), Offset(0, dy - 1), Offset(8, dy + 3)], false), chev);
        }
        canvas.save();
        canvas.translate(0, 4);
        _iconTrend(canvas, const Color(0xFFF6D3A3));
        canvas.restore();
      }
      case 3: {
        for (var i = 0; i < 4; i++) {
          final a = i * math.pi / 2 - math.pi / 2;
          _facetBody(
            canvas,
            [
              Offset(66 * math.cos(a), 66 * math.sin(a)),
              Offset(48 * math.cos(a + 0.2), 48 * math.sin(a + 0.2)),
              Offset(40 * math.cos(a), 40 * math.sin(a)),
              Offset(48 * math.cos(a - 0.2), 48 * math.sin(a - 0.2)),
            ],
            _silver,
            light,
            0.8,
          );
        }
        body = _polyPts(6, 56);
        _facetBody(canvas, body, _silver, light);
        _enamel(canvas, _polyPts(6, 40), const Color(0xFF1B2A4A), const Color(0xFF070C1A));
        canvas.save();
        canvas.rotate(t * 0.15);
        final ticks = _stroke(blueHi.a(0.55), 0.8, cap: StrokeCap.butt);
        for (var i = 0; i < 48; i++) {
          final a = i / 48 * _tau, r0 = i % 4 == 0 ? 27.0 : 30.0;
          canvas.drawLine(Offset(r0 * math.cos(a), r0 * math.sin(a)), Offset(33 * math.cos(a), 33 * math.sin(a)), ticks);
        }
        canvas.restore();
        _gloss(canvas, 34);
        _iconCompass(canvas, const Color(0xFFEEF3F8), 0.5 * math.sin(t * 0.9) + 0.15 * math.sin(t * 2.7));
      }
      case 4: {
        body = _shieldPts(48, 66);
        _facetBody(canvas, body, _gold, light);
        final inner = _scalePts(body, 0.76, 2);
        _enamel(canvas, inner, blue.mix(_black, 0.35).a(1), blueDeep.a(1));
        canvas.save();
        canvas.clipPath(_path(inner));
        Offset at(double u) => Offset(-26 + 52 * u + 10 * math.sin(u * _tau), 34 - 64 * u);
        _dashedPolyline(canvas, List.generate(41, (i) => at(i / 40)), 3, 4, -t * 12, _stroke(const Color(0x8CF3D572), 1.4, cap: StrokeCap.butt));
        _bloom(canvas, at((t * 0.25) % 1), 7, _goldC, 0.9);
        _gloss(canvas, 44);
        canvas.restore();
        canvas.save();
        canvas.translate(0, 2);
        _iconNavigate(canvas, const Color(0xFFFFF1C4));
        canvas.restore();
      }
      case 5: {
        body = _starPts(8, 66, 50);
        _facetBody(canvas, body, _platinum, light);
        _ringMetal(canvas, 34, 40, _platinum, -t * 0.4);
        _enamel(canvas, _polyPts(48, 34), blue.a(1), blueDeep.a(1));
        _gloss(canvas, 34);
        canvas.save();
        canvas.clipPath(Path()..addOval(Rect.fromCircle(center: Offset.zero, radius: 33.5)));
        _comet(canvas, 29, t * 1.6, blueHi, 1.6, 2.2);
        canvas.restore();
        _iconMedal(canvas, Colors.white);
      }
      case 6: {
        _facetBody(canvas, _starPts(8, 70, 46, -math.pi / 2 + math.pi / 8), _gold, light, 0.8);
        body = _starPts(8, 70, 48);
        _facetBody(canvas, body, _obsidian, light);
        canvas.drawPath(_path(body), _stroke(const Color(0xE6F3D572), 1.1));
        _ringMetal(canvas, 32, 38, _gold, t * 0.5);
        _enamel(canvas, _polyPts(48, 32), const Color(0xFF22252C), const Color(0xFF050608));
        _gloss(canvas, 32);
        final c = (t % 4.5) / 4.5;
        final needle = c < 0.55 ? _pow(math.sin(c / 0.55 * math.pi / 2), 2) : 1 - _pow((c - 0.55) / 0.45, 0.6);
        canvas.save();
        canvas.scale(1.3, 1.3);
        _iconGauge(canvas, const Color(0xFFF3D572), _clamp01(needle * 1.05), const Color(0xFFFF4D4D));
        canvas.restore();
        for (var i = 0; i < 4; i++) {
          final a = i * math.pi / 2 - math.pi / 2;
          _gem(canvas, Offset(58 * math.cos(a), 58 * math.sin(a)), 3.4, a + math.pi / 2, const Color(0xFFF2FAFF), const Color(0xFF9FC4E6), const Color(0xFF5B3D08));
        }
      }
      default: {
        body = _starPts(12, 74, 58);
        _facetBody(canvas, body, _whiteGold, light);
        canvas.drawPath(
          _path(body),
          Paint()
            ..shader = SweepGradient(
              colors: const [Color(0x33FF5050), Color(0x33FFC83C), Color(0x335AE68C), Color(0x3346AAFF), Color(0x33BE6EFF), Color(0x33FF5050)],
              transform: GradientRotation(-t * 0.4),
            ).createShader(Rect.fromCircle(center: Offset.zero, radius: 80)),
        );
        _ringMetal(canvas, 40, 47, _whiteGold, t * 0.6);
        _enamel(canvas, _polyPts(48, 40), blue.a(1), blueDeep.a(1));
        canvas.save();
        canvas.clipPath(Path()..addOval(Rect.fromCircle(center: Offset.zero, radius: 39.5)));
        for (final st in s.stars) {
          final tw = 0.3 + 0.7 * _pow(math.max(0.0, math.sin(t * 1.7 + st[2])), 3);
          canvas.drawCircle(Offset(st[0], st[1]), 0.6 + tw * 0.6, _fill(_white.a(tw)));
        }
        canvas.restore();
        _gloss(canvas, 40);
        for (var i = 0; i < 6; i++) {
          final a = i * math.pi / 3 - math.pi / 2;
          _gem(canvas, Offset(60 * math.cos(a), 60 * math.sin(a)), 3.4, a + math.pi / 2, blueHi.a(1), blue.mix(_black, 0.3).a(1), const Color(0xFF8A6417));
        }
        canvas.save();
        canvas.scale(1.25, 1.25);
        _iconAward(canvas, const Color(0xFFFFF1C4));
        canvas.restore();
      }
    }

    // Parlama süpürmesi
    const sweepCycle = [0.0, 7.0, 6.0, 5.0, 4.5, 4.0, 3.6, 3.2];
    const sweepAlpha = [0.0, 0.25, 0.35, 0.45, 0.5, 0.55, 0.5, 0.6];
    _sweep(canvas, body, sweepCycle[tier], sweepAlpha[tier]);

    // Şerit ve Roma rakamı
    final bottom = tier == 2 ? 58.0 : (tier == 4 ? 66.0 : _bodyR[tier]);
    const ribbonStops = [_steel, _steel, _bronze, _silver, _gold, _platinum, _gold, _whiteGold];
    final ink = tier == 6
        ? const Color(0xFF1A1206)
        : tier >= 4
            ? blueDeep.a(1)
            : (tier == 2 ? const Color(0xFF3A1C06) : const Color(0xFF1B2330));
    _ribbon(canvas, bottom + 2, tier >= 6 ? 24.0 : 19.0, _roman[tier], ribbonStops[tier], ink);

    if (tier == 7) _crown(canvas, -_bodyR[7] - 2 + 1.2 * math.sin(t * 1.6));
    if (tier == 6) _comet(canvas, 80, t * 1.1, _goldC, 1.3, 2.2);
    if (tier == 7) {
      _comet(canvas, 84, t * 1.3 + 1, _goldC, 1.5, 2.6);
      if (s.shock < 1) {
        final q = s.shock;
        canvas.drawCircle(Offset.zero, 76 + 46 * (1 - (1 - q) * (1 - q)), _stroke(blueHi.mix(_goldC, 0.4).a((1 - q) * 0.8), 2.6 * (1 - q) + 0.4));
      }
    }
    for (final g in s.glints) {
      final q = math.sin(math.pi * (g.age / g.life));
      _star(canvas, g.pos, g.size * q, g.age * 1.6, q);
    }
  }

  @override
  bool shouldRepaint(_EmblemPainter old) => old.tier != tier || old.accent.r != accent.r || old.accent.g != accent.g || old.accent.b != accent.b;
}
