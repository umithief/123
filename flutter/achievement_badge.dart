// Motonom başarım rozetleri: animasyonlu altıgen rozetler (ELİT, MİTİK, kilitli).
// Profil çerçeveleriyle aynı tasarım; tek dosya, yalnızca Flutter SDK kullanır.
//
// Kullanım:
//   AchievementBadge(tier: BadgeTier.elite, motif: BadgeMotif.night, size: 96, child: Icon(Icons.nightlight_round))
//   AchievementBadge(tier: BadgeTier.locked, progress: 60, child: Icon(Icons.lock_outline))
//   AchievementBadge(tier: BadgeTier.mythic, motif: BadgeMotif.speed, celebrateKey: kazanmaAni, child: Icon(Icons.speed))
//
// celebrateKey değiştiğinde kazanma animasyonu oynar (ör. rozet kazanıldığı an bir sayaç ya da zaman damgası ver).

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

enum BadgeTier { locked, elite, mythic }

enum BadgeMotif { night, speed, route, social, trophy, explore, shield, pulse }

/// Uygulamadaki başarımlar için önerilen motifler.
const Map<String, BadgeMotif> achievementMotifs = {
  'Gece Devriyesi': BadgeMotif.night,
  'Karanlık Sürücüsü': BadgeMotif.night,
  'Konvoy Lideri': BadgeMotif.social,
  'Kardeşlik Bağı': BadgeMotif.social,
  'Topluluk İkonu': BadgeMotif.social,
  'Etkinlik Mimarı': BadgeMotif.trophy,
  'Büyük Organizatör': BadgeMotif.trophy,
  'Rota Kâşifi': BadgeMotif.route,
  'Rota Üstadı': BadgeMotif.route,
  'Mesafe Avcısı': BadgeMotif.route,
  'Kıtalararası Gezgin': BadgeMotif.explore,
  'Apex Virtüözü': BadgeMotif.explore,
  'Pist Sürati': BadgeMotif.speed,
  'Süper Spor Uzmanı': BadgeMotif.speed,
  'Apex Koleksiyoneri': BadgeMotif.trophy,
};

class AchievementBadge extends StatefulWidget {
  const AchievementBadge({
    super.key,
    required this.tier,
    this.motif = BadgeMotif.pulse,
    this.progress = 0,
    this.progressColor = const Color(0xFF12805C),
    this.size = 96,
    this.celebrateKey,
    this.child,
  });

  final BadgeTier tier;
  final BadgeMotif motif;

  /// 0-100, yalnızca kilitli rozette çevrede ilerleme çizgisi olarak görünür.
  final double progress;
  final Color progressColor;
  final double size;

  /// Değiştiğinde kazanma animasyonu oynar.
  final Object? celebrateKey;

  /// Ortadaki ikon.
  final Widget? child;

  @override
  State<AchievementBadge> createState() => _AchievementBadgeState();
}

class _AchievementBadgeState extends State<AchievementBadge> with TickerProviderStateMixin {
  late final _BadgeScene _scene = _BadgeScene(math.Random());
  final ValueNotifier<int> _frame = ValueNotifier<int>(0);
  Ticker? _ticker;
  Duration _last = Duration.zero;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduced = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (reduced) {
      _ticker?.dispose();
      _ticker = null;
      if (_scene.t == 0) {
        for (var i = 0; i < 150; i++) {
          _scene.step(1 / 30, widget.tier);
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
    _scene.step(dt, widget.tier);
    _frame.value++;
  }

  @override
  void didUpdateWidget(AchievementBadge old) {
    super.didUpdateWidget(old);
    if (widget.celebrateKey != old.celebrateKey && widget.tier != BadgeTier.locked) {
      _scene.celebrate();
    }
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
    final iconColor = switch (widget.tier) {
      BadgeTier.elite => const Color(0xFFECE4B6),
      BadgeTier.mythic => const Color(0xFFFFA3C0),
      BadgeTier.locked => Colors.white,
    };
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
                  painter: _BadgePainter(
                    scene: _scene,
                    tier: widget.tier,
                    motif: widget.motif,
                    progress: widget.progress,
                    progressColor: widget.progressColor,
                    repaint: _frame,
                  ),
                ),
              ),
            ),
          ),
          if (widget.child != null)
            Center(
              child: ValueListenableBuilder<int>(
                valueListenable: _frame,
                builder: (context, _, child) {
                  // Kazanma anında ikon büyüyerek belirir
                  final age = _scene.burstAge;
                  final pop = age < 0.7 ? 0.4 + 0.6 * _easeOutBack(age / 0.7) : 1.0;
                  return Transform.scale(scale: pop, child: child);
                },
                child: SizedBox(
                  width: 0.32 * s,
                  height: 0.32 * s,
                  child: IconTheme(
                    data: IconThemeData(color: iconColor, size: 0.32 * s),
                    child: FittedBox(child: widget.child),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

double _easeOutBack(double x) {
  const c1 = 1.70158, c3 = c1 + 1;
  final k = x - 1;
  return 1 + c3 * k * k * k + c1 * k * k;
}

// --- RENK VE GEOMETRİ YARDIMCILARI ---

const double _tau = math.pi * 2;
const double _hexOut = 86;
const double _hexIn = 73;

double _clamp01(double v) => v < 0 ? 0 : (v > 1 ? 1 : v);
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

class _TierStyle {
  const _TierStyle(this.bezel, this.face0, this.face1, this.glow, this.spark);
  final List<int> bezel;
  final int face0, face1;
  final _Rgb glow, spark;
}

const Map<BadgeTier, _TierStyle> _tiers = {
  BadgeTier.elite: _TierStyle([0x3E3A1C, 0xA59B5C, 0xEFE6B4, 0x7F7640, 0x2E2B14], 0x33362A, 0x121310, _Rgb(214, 190, 120), _Rgb(240, 222, 160)),
  BadgeTier.mythic: _TierStyle([0x4A0F22, 0xC4607E, 0xFFD6E2, 0x8F2C48, 0x33091A], 0x45142A, 0x12040A, _Rgb(255, 80, 135), _Rgb(255, 160, 195)),
  BadgeTier.locked: _TierStyle([0x8B9096, 0xD9DDE1, 0xF6F7F8, 0xB2B7BC, 0x868B91], 0xC2C6CB, 0x8E9399, _Rgb(180, 185, 190), _Rgb(255, 255, 255)),
};

Color _hexColor(int v, [double alpha = 1]) => _Rgb.hex(v).a(alpha);

List<Offset> _hexVerts(double r) =>
    List.generate(6, (i) {
      final a = -math.pi / 2 + i * math.pi / 3;
      return Offset(r * math.cos(a), r * math.sin(a));
    });

/// Köşeleri yuvarlatılmış altıgen (tepe köşesi yukarıda).
Path _hexPath(double r, double round) {
  final v = _hexVerts(r);
  final path = Path();
  for (var i = 0; i < 6; i++) {
    final p = v[i], prev = v[(i + 5) % 6], next = v[(i + 1) % 6];
    final toPrev = prev - p, toNext = next - p;
    final p1 = p + toPrev / toPrev.distance * round;
    final p2 = p + toNext / toNext.distance * round;
    if (i == 0) {
      path.moveTo(p1.dx, p1.dy);
    } else {
      path.lineTo(p1.dx, p1.dy);
    }
    path.quadraticBezierTo(p.dx, p.dy, p2.dx, p2.dy);
  }
  path.close();
  return path;
}

/// Altıgen çevresinde tepe köşesinden saat yönünde f (0-1) kadar ilerlemiş nokta.
Offset _hexPoint(double r, double f) {
  final v = _hexVerts(r);
  final x = (((f % 1) + 1) % 1) * 6;
  final e = x.floor() % 6;
  final k = x - x.floor();
  return Offset.lerp(v[e], v[(e + 1) % 6], k)!;
}

Path _hexArc(double r, double f0, double f1) {
  final path = Path();
  final steps = math.max(2, ((f1 - f0) * 60).ceil());
  for (var i = 0; i <= steps; i++) {
    final p = _hexPoint(r, _lerp(f0, f1, i / steps));
    if (i == 0) {
      path.moveTo(p.dx, p.dy);
    } else {
      path.lineTo(p.dx, p.dy);
    }
  }
  return path;
}

Shader _metalSweep(List<int> stops, double angle, int repeat) {
  final colors = <Color>[];
  final pos = <double>[];
  final n = stops.length;
  for (var r = 0; r < repeat; r++) {
    for (var i = 0; i < n; i++) {
      colors.add(_hexColor(stops[i]));
      pos.add((r + i / n) / repeat);
    }
  }
  colors.add(_hexColor(stops[0]));
  pos.add(1);
  return SweepGradient(colors: colors, stops: pos, transform: GradientRotation(angle))
      .createShader(Rect.fromCircle(center: Offset.zero, radius: 100));
}

void _bloom(Canvas canvas, Offset c, double r, _Rgb col, double a) {
  if (a <= 0 || r <= 0) return;
  final paint = Paint()
    ..shader = RadialGradient(
      colors: [col.mix(_white, 0.7).a(a), col.a(a * 0.55), col.a(0)],
      stops: const [0, 0.35, 1],
    ).createShader(Rect.fromCircle(center: c, radius: r));
  canvas.drawCircle(c, r, paint);
}

void _star(Canvas canvas, Offset c, double size, double rot, double alpha) {
  if (size <= 0 || alpha <= 0) return;
  final path = Path();
  for (var i = 0; i < 8; i++) {
    final r = i.isOdd ? size * 0.16 : size * (i % 4 != 0 ? 0.6 : 1.0);
    final a = rot + i / 8 * _tau;
    final p = c + Offset(r * math.cos(a), r * math.sin(a));
    if (i == 0) {
      path.moveTo(p.dx, p.dy);
    } else {
      path.lineTo(p.dx, p.dy);
    }
  }
  path.close();
  canvas.drawPath(path, Paint()..color = _white.a(alpha));
}

Paint _stroke(Color c, double w, {StrokeCap cap = StrokeCap.round}) => Paint()
  ..style = PaintingStyle.stroke
  ..color = c
  ..strokeWidth = w
  ..strokeCap = cap
  ..strokeJoin = StrokeJoin.round;

void _dashedPolyline(Canvas canvas, List<Offset> pts, double dash, double gap, double offset, Paint paint) {
  final period = dash + gap;
  var pos = ((offset % period) + period) % period;
  for (var i = 1; i < pts.length; i++) {
    final a = pts[i - 1], b = pts[i];
    final len = (b - a).distance;
    var d = 0.0;
    while (d < len) {
      final inDash = pos < dash;
      final remain = inDash ? dash - pos : period - pos;
      final stepLen = math.min(remain, len - d);
      if (inDash) {
        canvas.drawLine(Offset.lerp(a, b, d / len)!, Offset.lerp(a, b, (d + stepLen) / len)!, paint);
      }
      d += stepLen;
      pos = (pos + stepLen) % period;
    }
  }
}

// --- SAHNE DURUMU ---

class _MotifPoint {
  _MotifPoint(this.x, this.y, this.ph, this.s, this.v);
  final double x, y, ph, s, v;
}

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

class _BadgeScene {
  _BadgeScene(this.rnd) {
    for (var i = 0; i < 30; i++) {
      final a = rnd.nextDouble() * _tau, r = 18 + rnd.nextDouble() * 50;
      pts.add(_MotifPoint(r * math.cos(a), r * math.sin(a), rnd.nextDouble() * _tau, rnd.nextDouble(), rnd.nextDouble()));
    }
    for (var i = 0; i < 70; i++) {
      brush.add([-80 + rnd.nextDouble() * 160, 0.5 + rnd.nextDouble() * 1.2, rnd.nextBool() ? 1.0 : 0.0]);
    }
  }

  final math.Random rnd;
  final List<_MotifPoint> pts = [];
  final List<List<double>> brush = [];
  final List<_Mote> motes = [];
  final List<_Glint> glints = [];
  double t = 0, acc = 0, nextGlint = 0.8, burstAge = 9;

  static const _moteRate = {BadgeTier.locked: 0.0, BadgeTier.elite: 6.0, BadgeTier.mythic: 14.0};
  static const _glintEvery = {BadgeTier.locked: 0.0, BadgeTier.elite: 1.1, BadgeTier.mythic: 0.6};

  void celebrate() {
    burstAge = 0;
    for (var i = 0; i < 64; i++) {
      final a = rnd.nextDouble() * _tau, v = 60 + rnd.nextDouble() * 120;
      motes.add(_Mote(60 * math.cos(a), 60 * math.sin(a), math.cos(a) * v, math.sin(a) * v, 0.7 + rnd.nextDouble() * 0.8, 0.8 + rnd.nextDouble() * 1.6));
    }
  }

  void step(double dt, BadgeTier tier) {
    t += dt;
    burstAge += dt;
    acc += dt * _moteRate[tier]!;
    while (acc >= 1) {
      acc -= 1;
      final p = _hexPoint(_hexOut + 2, rnd.nextDouble());
      final rise = tier == BadgeTier.mythic ? 30 : 16;
      motes.add(_Mote(p.dx, p.dy, (rnd.nextDouble() - 0.5) * 10, -14 - rnd.nextDouble() * rise, 1.4 + rnd.nextDouble() * 1.2, 0.6 + rnd.nextDouble() * 1.1));
    }
    for (final m in motes) {
      m.vx *= 1 - 1.2 * dt;
      m.vy *= 1 - 0.6 * dt;
      m.x += (m.vx + 5 * math.sin(m.life * 4)) * dt;
      m.y += m.vy * dt;
      m.life -= dt;
    }
    motes.removeWhere((m) => m.life <= 0);

    final every = _glintEvery[tier]!;
    if (every > 0) {
      nextGlint -= dt;
      if (nextGlint <= 0) {
        nextGlint = every * (0.6 + rnd.nextDouble() * 0.8);
        final r = rnd.nextDouble() < 0.6 ? _hexOut - 1 : 79.0;
        final f = rnd.nextInt(6) / 6 + (rnd.nextBool() ? 0 : 0.03);
        glints.add(_Glint(_hexPoint(r, f), 0.6 + rnd.nextDouble() * 0.3, 6 + rnd.nextDouble() * 6));
      }
    }
    for (final g in glints) {
      g.age += dt;
    }
    glints.removeWhere((g) => g.age >= g.life);
  }
}

// --- ÇİZİM ---

class _BadgePainter extends CustomPainter {
  _BadgePainter({
    required this.scene,
    required this.tier,
    required this.motif,
    required this.progress,
    required this.progressColor,
    required Listenable repaint,
  }) : super(repaint: repaint);

  final _BadgeScene scene;
  final BadgeTier tier;
  final BadgeMotif motif;
  final double progress;
  final Color progressColor;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 260;
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.scale(k, k);
    _draw(canvas);
    canvas.restore();
  }

  void _draw(Canvas canvas) {
    final s = scene;
    final t = s.t;
    final st = _tiers[tier]!;
    final earned = tier != BadgeTier.locked;

    // Arka ışık: nefes alan hale; MİTİK'te dönen huzmeler
    if (earned) {
      final pulse = 0.8 + 0.2 * math.sin(t * 1.6);
      canvas.drawCircle(
        Offset.zero,
        126,
        Paint()
          ..shader = RadialGradient(colors: [st.glow.a(0.5 * pulse), st.glow.a(0.5 * pulse), st.glow.a(0)], stops: const [0, 50 / 126, 1])
              .createShader(Rect.fromCircle(center: Offset.zero, radius: 126)),
      );
    }
    if (tier == BadgeTier.mythic) {
      final rays = Paint()
        ..shader = RadialGradient(colors: [st.glow.a(0), st.glow.a(0.45), st.glow.a(0)], stops: const [0, 70 / 128, 1])
            .createShader(Rect.fromCircle(center: Offset.zero, radius: 128));
      canvas.save();
      canvas.rotate(t * 0.15);
      for (var i = 0; i < 12; i++) {
        final a = i / 12 * _tau, hw = i.isOdd ? 0.05 : 0.09, big = i.isOdd ? 112.0 : 128.0;
        final path = Path()
          ..moveTo(70 * math.cos(a - hw * 0.4), 70 * math.sin(a - hw * 0.4))
          ..lineTo(big * math.cos(a - hw), big * math.sin(a - hw))
          ..lineTo(big * math.cos(a + hw), big * math.sin(a + hw))
          ..lineTo(70 * math.cos(a + hw * 0.4), 70 * math.sin(a + hw * 0.4))
          ..close();
        canvas.drawPath(path, rays);
      }
      canvas.restore();
    }

    // Yükselen toz / korlar
    for (final m in s.motes) {
      final kk = _clamp01(m.life / m.max);
      canvas.drawCircle(Offset(m.x, m.y), m.size * (0.5 + 0.5 * kk), Paint()..color = st.spark.mix(_white, 0.3 * kk).a(math.min(1.0, kk * 1.5) * 0.9));
    }

    // Gölge, metal çerçeve ve ışık alan/gölgede kalan fasetler
    canvas.drawPath(_hexPath(_hexOut, 10).shift(const Offset(0, 5)), Paint()..color = Color.fromARGB(earned ? 71 : 36, 0, 0, 0));
    final outer = _hexPath(_hexOut, 10);
    canvas.drawPath(outer, Paint()..shader = _metalSweep(st.bezel, t * (earned ? 0.25 : 0.08), 2));
    canvas.save();
    canvas.clipPath(outer);
    final vo = _hexVerts(_hexOut + 4), vi = _hexVerts(_hexIn);
    for (var i = 0; i < 6; i++) {
      final j = (i + 1) % 6;
      final normal = -math.pi / 2 + (i + 0.5) * (math.pi / 3);
      final shade = math.cos(normal - (-3 * math.pi / 4));
      final c = shade > 0 ? _white.a(0.3 * shade) : const _Rgb(0, 0, 0).a(0.34 * -shade);
      final path = Path()
        ..moveTo(vo[i].dx, vo[i].dy)
        ..lineTo(vo[j].dx, vo[j].dy)
        ..lineTo(vi[j].dx, vi[j].dy)
        ..lineTo(vi[i].dx, vi[i].dy)
        ..close();
      canvas.drawPath(path, Paint()..color = c);
    }
    canvas.restore();
    canvas.drawPath(_hexPath(_hexOut - 1, 9.5), _stroke(_white.a(0.4), 0.9));
    canvas.drawPath(_hexPath(_hexIn + 1, 7), _stroke(const _Rgb(0, 0, 0).a(0.45), 2));

    // Yüz: koyu mine (kilitlide fırçalanmış gümüş)
    final facePath = _hexPath(_hexIn, 7);
    canvas.drawPath(
      facePath,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-0.22, -0.28),
          radius: 1,
          colors: [_hexColor(st.face0), _hexColor(st.face1)],
        ).createShader(Rect.fromCircle(center: Offset.zero, radius: 100)),
    );
    canvas.save();
    canvas.clipPath(_hexPath(_hexIn - 0.5, 6.5));
    if (earned) {
      _drawMotif(canvas, st.spark);
    } else {
      for (final b in s.brush) {
        canvas.drawRect(Rect.fromLTWH(-80, b[0], 160, b[1] * 0.5), Paint()..color = b[2] == 1 ? _white.a(0.16) : const _Rgb(0, 0, 0).a(0.07));
      }
    }
    canvas.restore();
    if (earned) {
      // İkonun arkasında nefes alan ışık
      _bloom(canvas, Offset.zero, 34 + 3 * math.sin(t * 2), st.spark, 0.22);
    }

    // Kenarda dolaşan ışık: ELİT'te bir altın parıltı, MİTİK'te iki enerji darbesi
    if (earned) {
      final pulses = tier == BadgeTier.mythic ? [t * 0.32, t * 0.32 + 0.5] : [t * 0.18];
      for (final f in pulses) {
        for (var j = 0; j < 12; j++) {
          final f0 = f - j * 0.008, kk = 1 - j / 12;
          canvas.drawPath(_hexArc(_hexIn + 0.5, f0 - 0.009, f0), _stroke(st.spark.mix(_white, 0.4 * kk).a(kk * 0.95), 1.8 * kk + 0.4));
        }
        _bloom(canvas, _hexPoint(_hexIn + 0.5, f), 7, st.spark, 0.9);
      }
    }

    // Köşeler: ELİT'te pirinç perçinler, MİTİK'te yakutlar
    if (earned) {
      for (final p in _hexVerts(79.5)) {
        if (tier == BadgeTier.elite) {
          canvas.drawCircle(
            p,
            2.6,
            Paint()
              ..shader = const RadialGradient(
                center: Alignment(-0.3, -0.3),
                colors: [Color(0xFFFFF6D2), Color(0xFFB7AA62), Color(0xFF4A4420)],
                stops: [0, 0.5, 1],
              ).createShader(Rect.fromCircle(center: p, radius: 2.8)),
          );
        } else {
          Path diamond(double r) => Path()
            ..moveTo(p.dx, p.dy - r)
            ..lineTo(p.dx + r, p.dy)
            ..lineTo(p.dx, p.dy + r)
            ..lineTo(p.dx - r, p.dy)
            ..close();
          canvas.drawPath(diamond(3.6), Paint()..color = const Color(0xFF5A1528));
          canvas.drawPath(diamond(2.6), Paint()..color = const Color(0xFFFF5F8F));
          canvas.drawPath(
            Path()
              ..moveTo(p.dx - 1.3, p.dy - 0.3)
              ..lineTo(p.dx, p.dy - 1.9)
              ..lineTo(p.dx + 0.4, p.dy - 0.3)
              ..close(),
            Paint()..color = _white.a(0.85),
          );
        }
      }
    }

    // Kilitli: çevrede ilerleme oluğu ve ilerleme çizgisi
    if (!earned) {
      final p = _clamp01(progress / 100);
      final col = _Rgb.ofColor(progressColor);
      canvas.drawPath(_hexPath(79.5, 8.5), _stroke(const _Rgb(0, 0, 0).a(0.16), 3.4));
      if (p > 0) {
        final arc = _hexArc(79.5, 0, p);
        canvas.drawPath(arc, _stroke(col.a(1), 3.4));
        canvas.drawPath(arc, _stroke(_white.a(0.35), 0.8));
        final head = _hexPoint(79.5, p);
        _bloom(canvas, head, 8 + 2 * math.sin(t * 3), col, 0.8);
        canvas.drawCircle(head, 1.4, Paint()..color = Colors.white);
      }
    }

    // Çapraz parlama süpürmesi
    final cycle = earned ? 4.2 : 6.5;
    final q = (t % cycle) / 1.3;
    if (q < 1) {
      canvas.save();
      canvas.clipPath(outer);
      canvas.rotate(-math.pi / 4);
      final x = _lerp(-130, 130, q);
      canvas.drawRect(
        Rect.fromLTWH(x - 18, -140, 36, 280),
        Paint()
          ..shader = LinearGradient(
            colors: [_white.a(0), _white.a(earned ? 0.42 : 0.3), _white.a(0)],
          ).createShader(Rect.fromLTWH(x - 18, -140, 36, 280)),
      );
      canvas.restore();
    }

    // Parıltılar
    for (final g in s.glints) {
      final kk = math.sin(math.pi * (g.age / g.life));
      _star(canvas, g.pos, g.size * kk, g.age * 1.5, kk);
    }

    // Kazanma anı: parlama ve iki altıgen şok dalgası
    if (s.burstAge < 1.6) {
      final flash = math.max(0.0, 1 - s.burstAge / 0.5);
      if (flash > 0) _bloom(canvas, Offset.zero, 90 + 30 * (1 - flash), st.spark.mix(_white, 0.5), 0.8 * flash);
      for (final delay in [0.0, 0.25]) {
        final q2 = (s.burstAge - delay) / 1.1;
        if (q2 <= 0 || q2 >= 1) continue;
        canvas.drawPath(
          _hexPath(_hexOut + 42 * (1 - (1 - q2) * (1 - q2)), 12),
          _stroke(st.spark.mix(_white, 0.4).a((1 - q2) * 0.9), 3 * (1 - q2) + 0.5),
        );
      }
    }
  }

  // --- MOTİFLER: rozet yüzünde, ikonun arkasında ---
  void _drawMotif(Canvas canvas, _Rgb c) {
    final t = scene.t;
    final pts = scene.pts;
    switch (motif) {
      case BadgeMotif.night: {
        _bloom(canvas, Offset.zero, 46, c, 0.18);
        for (final p in pts) {
          final tw = 0.25 + 0.75 * _pow(math.max(0.0, math.sin(t * (1.2 + p.v) + p.ph)), 3);
          canvas.drawCircle(Offset(p.x, p.y), 0.5 + p.s * 0.9, Paint()..color = c.mix(_white, 0.6).a(tw));
          if (tw > 0.85 && p.s > 0.7) _star(canvas, Offset(p.x, p.y), 4 * tw, 0, 0.8 * tw);
        }
        final sh = (t % 5) / 0.9;
        if (sh < 1) {
          final head = Offset(_lerp(-60, 50, sh), _lerp(-45, 25, sh));
          final tail = head - const Offset(26, 17);
          canvas.drawLine(
            tail,
            head,
            _stroke(Colors.white, 1.2)..shader = LinearGradient(colors: [_white.a(0), _white.a(0.9 * (1 - sh))]).createShader(Rect.fromPoints(tail, head)),
          );
        }
      }
      case BadgeMotif.speed: {
        canvas.save();
        canvas.rotate(-0.18);
        for (final p in pts.take(18)) {
          final q = (t * (0.6 + p.v) + p.ph) % 1;
          final x = 90 - q * 190, len = 14 + p.s * 30, y = p.y * 0.9;
          canvas.drawLine(
            Offset(x, y),
            Offset(x + len, y),
            _stroke(Colors.white, 0.6 + p.s * 1.2)
              ..shader = LinearGradient(colors: [c.a(0.75), c.a(0)]).createShader(Rect.fromLTWH(x, y - 1, len, 2)),
          );
        }
        canvas.restore();
      }
      case BadgeMotif.route: {
        final grid = _stroke(c.a(0.08), 0.5, cap: StrokeCap.butt);
        for (var g = -70.0; g <= 70; g += 14) {
          canvas.drawLine(Offset(g, -80), Offset(g, 80), grid);
          canvas.drawLine(Offset(-80, g), Offset(80, g), grid);
        }
        Offset at(double u) => Offset(-62 + 124 * u, 44 - 88 * u + 15 * math.sin(u * _tau * 1.5));
        final routePts = List.generate(61, (i) => at(i / 60));
        _dashedPolyline(canvas, routePts, 4, 4, -t * 18, _stroke(c.a(0.5), 1.6, cap: StrokeCap.butt));
        final u = (t * 0.22) % 1;
        for (var j = 10; j > 0; j--) {
          canvas.drawCircle(at(math.max(0.0, u - j * 0.012)), 1.6, Paint()..color = c.a((1 - j / 10) * 0.6));
        }
        _bloom(canvas, at(u), 8, c, 0.9);
      }
      case BadgeMotif.social: {
        const n = 7;
        final nodes = List.generate(n, (i) {
          final a = i / n * _tau + t * 0.25, r = 46 + 6 * math.sin(t * 0.9 + i);
          return Offset(r * math.cos(a), r * math.sin(a));
        });
        for (var i = 0; i < n; i++) {
          for (final j in [(i + 1) % n, (i + 3) % n]) {
            final pulse = 0.5 + 0.5 * math.sin(t * 2 + i);
            canvas.drawLine(nodes[i], nodes[j], _stroke(c.a(0.12 + 0.2 * pulse), 0.7));
            final q = (t * 0.6 + i * 0.3) % 1;
            _bloom(canvas, Offset.lerp(nodes[i], nodes[j], q)!, 3, c, 0.7 * math.sin(math.pi * q));
          }
        }
        for (final p in nodes) {
          _bloom(canvas, p, 6, c, 0.5);
          canvas.drawCircle(p, 1.8, Paint()..color = c.mix(_white, 0.5).a(1));
        }
      }
      case BadgeMotif.trophy: {
        final rays = Paint()
          ..shader = RadialGradient(colors: [c.a(0.35), c.a(0.35), c.a(0)], stops: const [0, 10 / 80, 1])
              .createShader(Rect.fromCircle(center: Offset.zero, radius: 80));
        canvas.save();
        canvas.rotate(t * 0.25);
        for (var i = 0; i < 16; i++) {
          final a = i / 16 * _tau;
          const hw = 0.07;
          canvas.drawPath(
            Path()
              ..moveTo(0, 0)
              ..lineTo(90 * math.cos(a - hw), 90 * math.sin(a - hw))
              ..lineTo(90 * math.cos(a + hw), 90 * math.sin(a + hw))
              ..close(),
            rays,
          );
        }
        canvas.restore();
        for (final p in pts.take(10)) {
          final tw = _pow(math.max(0.0, math.sin(t * 1.6 + p.ph)), 6);
          if (tw > 0.05) _star(canvas, Offset(p.x, p.y), 5 * tw + 1, t, tw);
        }
      }
      case BadgeMotif.explore: {
        canvas.save();
        canvas.rotate(-t * 0.15);
        final ticks = _stroke(c.a(0.4), 0.6, cap: StrokeCap.butt);
        for (var i = 0; i < 72; i++) {
          final a = i / 72 * _tau, r0 = i % 6 == 0 ? 50.0 : 54.0;
          canvas.drawLine(Offset(r0 * math.cos(a), r0 * math.sin(a)), Offset(58 * math.cos(a), 58 * math.sin(a)), ticks);
        }
        canvas.restore();
        canvas.drawCircle(
          Offset.zero,
          70,
          Paint()
            ..shader = SweepGradient(colors: [c.a(0), c.a(0), c.a(0.4)], stops: const [0, 0.86, 1], transform: GradientRotation(t * 1.4))
                .createShader(Rect.fromCircle(center: Offset.zero, radius: 70)),
        );
        for (final p in pts.take(5)) {
          final a = math.atan2(p.y, p.x), sweep = t * 1.4;
          final since = (((sweep - a) % _tau) + _tau) % _tau;
          final glow = math.exp(-since * 1.2);
          if (glow > 0.05) _bloom(canvas, Offset(p.x * 0.8, p.y * 0.8), 5, c, glow);
        }
      }
      case BadgeMotif.shield: {
        const hr = 7.5;
        final w = hr * math.sqrt(3);
        for (var row = -7; row <= 7; row++) {
          for (var col = -6; col <= 6; col++) {
            final x = col * w + (row.isOdd ? w / 2 : 0), y = row * hr * 1.5;
            final d = math.sqrt(x * x + y * y);
            if (d > 78) continue;
            final b = _pow(0.5 + 0.5 * math.sin(d * 0.12 - t * 2.6), 4);
            final path = Path();
            for (var i = 0; i < 6; i++) {
              final a = i * math.pi / 3 + math.pi / 6;
              final px = x + (hr - 0.8) * math.cos(a), py = y + (hr - 0.8) * math.sin(a);
              if (i == 0) {
                path.moveTo(px, py);
              } else {
                path.lineTo(px, py);
              }
            }
            path.close();
            canvas.drawPath(path, _stroke(c.a(0.06 + 0.4 * b), 0.6));
          }
        }
      }
      case BadgeMotif.pulse: {
        for (var i = 0; i < 3; i++) {
          final q = (t * 0.55 + i / 3) % 1;
          canvas.drawPath(_hexPath(20 + 58 * q, 4), _stroke(c.a((1 - q) * 0.45), 1.2));
        }
      }
    }
  }

  @override
  bool shouldRepaint(_BadgePainter old) =>
      old.tier != tier || old.motif != motif || old.progress != progress || old.progressColor != progressColor;
}
