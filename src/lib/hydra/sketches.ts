export interface HydraSketch {
	name: string;
	code: string;
}

export interface SelectedSketch {
	index: number;
	name: string;
	code: string;
}

// sketches license: CC BY-NC-SA 4.0
export const sketches: HydraSketch[] = [
	{
		artist: 'ΔNDR0M3DΔ',
		name: '3.0',
		code:
		`noise(3, 0.3, 3).thresh(0.3, 0.03).diff(o3, 0.3).out(o1);

		gradient([0.3, 0.3, 3]).diff(o0).blend(o1).out(o3);

		voronoi(33, 3, 30).rotate(3, 0.3, 0).modulateScale(o2, 0.3).color(-3, 3, 0).brightness(3).out(o0);

		shape(30, 0.3, 1)
			.invert(({ time }) => Math.sin(time) * 3)
			.out(o2);

		render(o3);`
	},
	{
		artist: 'ΔNDR0M3DΔ',
		name: '3.3',
		code:
		`osc().modulateRotate(o0, 0.3).out();

		osc(33, 0.3, 0.3).diff(o3, 3).out(o1);

		osc(3, 0.3, 33).modulateKaleid(o3, 3).diff(o0).out(o2);

		src(o0, 3).mult(o1, 3).kaleid(3).out(o3);

		render(o2);`
	},
	{
		artist: 'Abhinay Khoparzi\nhttps://github.com/khoparzi',
		name: 'Aquatic Blubs',
		code:
		`gradient(0.25)
			.add(noise(), () => Math.cos(time))
			.modulateRotate(src(o0).rotate(0, -0.52), 0.2)
			.mult(shape(360), 0.8)
			.repeat(10, 5)
			.mult(
				shape(360).scale(() => Math.sin(time)),
				0.8
			)
			.rotate(0, 0.2)
			.diff(src(o0).rotate(0, -0.2), 0.2)
			.out();`
	},
	{
		artist: 'Abhinay Khoparzi\nhttps://github.com/khoparzi',
		name: 'Happy Mandala',
		code:
		`voronoi(5, -0.1, 5)
			.add(osc(1, 0, 1))
			.kaleid(21)
			.scale(1, 1, 2)
			.colorama()
			.out(o1);
		src(o1).mult(src(s0).modulateRotate(o1, 100), -0.5).out(o0);`
	},
	{
		artist: 'Abhinay Khoparzi\nhttps://github.com/khoparzi',
		name: 'Perpetual Elevator Buttons',
		code:
		`shape(3)
			.add(osc(1, 0.5, 1), 1)
			.add(o1, () => Math.sin(time / 4) * 0.7 + 0.1)
			//.repeat(5)
			.scale(() => Math.sin(time / 16))
			.rotate(0, -0.1)
			.out(o1);

		src(o1).rotate(0, 0.1).out();`
	},
	{
		artist: 'Abhinay Khoparzi\nhttps://github.com/khoparzi',
		name: 'Really Love',
		code:
		`osc(100, -0.01245, 1)
			.pixelate(50)
			.kaleid(() => Math.sin(time / 8) * 9 + 3)
			.rotate(0, 0.125)
			.modulateRotate(
				shape(3)
					.scale(() => Math.cos(time) * 2)
					.rotate(0, -0.25)
			)
			.diff(src(o0).brightness(0.3))
			.out();`
	},
	{
		artist: 'AFALFL',
		name: 'filet mignon',
		code:
		`osc(100, -0.0018, 0.17)
			.diff(osc(20, 0.00008).rotate(Math.PI / 0.00003))
			.modulateScale(noise(1.5, 0.18).modulateScale(osc(13).rotate(() => Math.sin(time / 22))), 3)
			.color(11, 0.5, 0.4, 0.9, 0.2, 0.011, 5, 22, 0.5, -1)
			.contrast(1.4)
			.add(src(o0).modulate(o0, 0.04), 0.6, 0.9)
			//.pixelate(0.4, 0.2, 0.1)
			.invert()
			.brightness(0.0003, 2)
			.contrast(0.5, 2, 0.1, 2)
			.color(4, -2, 0.1)
			.modulateScale(osc(2), -0.2, 2, 1, 0.3)
			.posterize(200)
			.rotate(1, 0.2, 0.01, 0.001)
			.color(22, -2, 0.5, 0.5, 0.0001, 0.1, 0.2, 8)
			.contrast(0.18, 0.3, 0.1, 0.2, 0.03, 1)
			.brightness(0.0001, -1, 10)
			.out();`
	},
	{
		artist: 'Alexandre Rangel',
		name: '"egg of the phoenix"',
		code:
		`speed = 1.2;
		shape(99, 0.15, 0.5)
			.color(0, 1, 2)
			.diff(
				shape(240, 0.5, 0)
					.scrollX(0.05)
					.rotate(() => time / 10)
					.color(1, 0, 0.75)
			)
			.diff(
				shape(99, 0.4, 0.002)
					.scrollX(0.1)
					.rotate(() => time / 20)
					.color(1, 0, 0.75)
			)
			.diff(
				shape(99, 0.3, 0.002)
					.scrollX(0.15)
					.rotate(() => time / 30)
					.color(1, 0, 0.75)
			)
			.diff(
				shape(99, 0.2, 0.002)
					.scrollX(0.2)
					.rotate(() => time / 40)
					.color(1, 0, 0.75)
			)
			.diff(
				shape(99, 0.1, 0.002)
					.scrollX(0.25)
					.rotate(() => time / 50)
					.color(1, 0, 0.75)
			)
			.modulateScale(
				shape(240, 0.5, 0)
					.scrollX(0.05)
					.rotate(() => time / 10),
				() => Math.sin(time / 3) * 0.2 + 0.2
			)
			.scale(1.6, 0.6, 1)
			.out();`
	},
	{
		artist: 'Alexandre Rangel',
		name: '"eye of the beholder"',
		code:
		`noise(6, 0.05)
			.mult(osc(9, 0, () => Math.sin(time / 1.5) + 2))
			.mult(
				noise(9, 0.03)
					.brightness(1.2)
					.contrast(2)
					.mult(osc(9, 0, () => Math.sin(time / 3) + 13))
			)
			.diff(
				noise(15, 0.04)
					.brightness(0.2)
					.contrast(1.3)
					.mult(osc(9, 0, () => Math.sin(time / 5) + 13))
					.rotate(() => time / 33)
			)
			.scale(() => Math.sin(time / 6.2) * 0.12 + 0.15)
			.modulateScale(
				osc(3, 0, 0)
					.mult(osc(3, 0, 0).rotate(3.14 / 2))
					.rotate(() => time / 25)
					.scale(0.39)
					.scale(1, 0.6, 1)
					.invert(),
				() => Math.sin(time / 5.3) * 1.5 + 3
			)
			.rotate(() => time / 22)
			.mult(shape(100, 0.9, 0.01).scale(1, 0.6, 1))
			.out();`
	},
	{
		artist: 'Alexandre Rangel',
		name: '"the wall"',
		code:
		`speed = 0.0222;
		osc(48, -0.1, 0)
			.thresh([0.3, 0.7].fast(0.75), 0)
			.color(0, 0, 1)

			.add(
				osc(28, 0.1, 0)
					.thresh([0.3, 0.7].fast(0.75), 0)
					.rotate(3.14 / 4)
					.color(1, 0, 0)
					.modulateScale(osc(64, -0.01, 0).thresh([0.3, 0.7].fast(0.75), 0))
			)
			.diff(
				osc(28, 0.1, 0)
					.thresh([0.3, 0.7].fast(0.5), 0)
					.rotate(3.14 / 2)
					.color(1, 0, 1)
					.modulateScale(osc(64, -0.015, 0).thresh([0.3, 0.7].fast(0.5), 0))
			)
			.modulateRotate(osc(54, -0.005, 0).thresh([0.3, 0.7].fast(0.25), 0))
			.modulateScale(osc(44, -0.02, 0).thresh([0.3, 0.7].fast(0.25), 0))
			.colorama(() => Math.sin(time / 27) * 0.01222 + 9.89)
			.scale(2.122)

			.out();`
	},
	{
		artist: 'Asdrúbal Gomez',
		code:
		`noise(3, 0.1, 7)
			.rotate(1, -1, -2)
			.mask(shape(20))
			.colorama(0.5)
			.modulateScale(o0)
			.modulateScale(o0, 1)
			.blend(o0)
			.blend(o0)
			.blend(o0)
			.blend(o0)
			.out(o0);`
	},
	{
		artist: 'Celeste Betancur\nhttps://github.com/essteban',
		name: 'Puertas',
		code:
		`osc(13, 0, 1)
			.modulate(osc(21, 0.25, 0))
			.modulateScale(osc(34))
			.modulateKaleid(osc(55), 0.1, 1)
			.out();`
	},
	{
		artist: 'Celeste Betancur\nhttps://github.com/essteban',
		name: 'Puertas II',
		code:
		`osc(13, 0, 1)
			.kaleid()
			.mask(shape(4, 0.3, 1))
			.modulateRotate(shape(4, 0.1, 1))
			.modulateRotate(shape(4, 0.1, 0.9))
			.modulateRotate(shape(4, 0.1, 0.8))
			.scale(0.3)
			.add(shape(4, 0.2, 1).color(0.3, 1, 1, 0.5))
			.rotate(() => time)
			.out();`
	},
	{
		artist: 'Celeste Betancur\nhttps://github.com/essteban',
		name: 'Puertas III',
		code:
		`osc(40, 0.2, 1)
			.modulateScale(osc(40, 0, 1).kaleid(8))
			.repeat(2, 4)
			.modulate(o0, 0.05)
			.modulateKaleid(shape(4, 0.1, 1))
			.out(o0);`
	},
	{
		artist: 'CNDSD',
		name: 'Ameba',
		code:
		`osc(15, 0.01, 0.1)
			.mult(osc(1, -0.1).modulate(osc(2).rotate(4, 1), 20))
			.color(0, 2.4, 5)
			.saturate(0.4)
			.luma(1, 0.1, (6, () => 1 + a.fft[3]))
			.scale(0.7, () => 0.7 + a.fft[3])
			.diff(o0) // o0
			.out(o0); // o1`
	},
	{
		artist: 'CNDSD',
		name: 'Crazy Squares',
		code:
		`shape(4, (0.01, () => 0.2 + a.fft[2]), 1)
			.mult(osc(1, 1).modulate(osc(5).rotate(1.4, 1), 3))
			.color(1, 2, 4)
			.saturate(0.2)
			.luma(1.2, 0.05, (5, () => 2 + a.fft[3]))
			.scale(0.6, () => 0.9 + a.fft[3])
			.diff(o0) // o0
			.out(o0); // o1`
	},
	{
		artist: 'CNDSD',
		name: 'Sand Spirals',
		code:
		`osc(3, 0.01, 0.4)
			.color(1.2, 1.2, 1.3)
			.saturate(0.4)
			.modulateRepeat(osc(2), 1, 2, 4, 3)
			.modulateKaleid(osc(12, 0.05, 0), 1)
			.luma(0.4)
			.rotate(4, 0.1, 0)
			.modulate(o0, () => mouse.y * 0.0002)
			.scale(1)
			.diff(o1)
			.out(o0);`
	},
	{
		artist: 'Débora Falleiros Gonzales',
		code: 'osc(5).add(noise(5, 2)).color(0, 0, 3).colorama(0.4).out();'
	},
	{
		artist: 'eerie_ear e_e',
		name: 'EYE IN THE SKY',
		code:
		`// example of mask and function modulation
		noise(18)
			.colorama(1)
			.posterize(2)
			.kaleid(50)
			.mask(shape(25, 0.25).modulateScale(noise(400.5, 0.5)))
			.mask(shape(400, 1, 2.125))
			.modulateScale(osc(6, 0.125, 0.05).kaleid(50))
			.mult(osc(20, 0.05, 2.4).kaleid(50), 0.25)
			.scale(1.75, 0.65, 0.5)
			.modulate(noise(0.5))
			.saturate(6)
			.posterize(4, 0.2)
			.scale(1.5)
			.out();`
	},
	{
		artist: 'eerie_ear e_e',
		name: 'FUGITIVE GEOMETRY VHS',
		code:
		`// audioreactive shapes and gradients
		s = () =>
			shape(4)
				.scrollX([-0.5, -0.2, 0.3, -0.1, -0.1].smooth(0.1).fast(0.3))
				.scrollY([0.25, -0.2, 0.3, -0.1, 0.2].smooth(0.9).fast(0.15));
		solid()
			.add(
				gradient(3, 0.05).rotate(0.05, -0.2).posterize(2).contrast(0.6),
				[1, 0, 1, 0.5, 0, 0.6].smooth(0.9)
			)
			.add(s())
			.mult(
				s()
					.scale(0.8)
					.scrollX(0.01)
					.scrollY(-0.01)
					.rotate(0.2, 0.06)
					.add(gradient(3).contrast(0.6), [1, 0, 1, 0.5].smooth(0.9), 0.5)
					.mult(src(o0).scale(0.98), () => a.fft[0] * 9)
			)
			.diff(s().modulate(shape(500)).scale([1.7, 1.2].smooth(0.9).fast(0.05)))
			.add(gradient(2).invert(), () => a.fft[2])
			.mult(gradient(() => a.fft[3] * 8))
			.blend(src(o0, () => a.fft[1] * 40))
			.add(
				voronoi(
					() => a.fft[1],
					() => a.fft[3],
					() => a.fft[0]
				)
					.thresh(0.7)
					.posterize(2, 4)
					.luma(0.9)
					.scrollY(1, () => a.fft[0] / 30)
					.colorama(3)
					.thresh(() => a.fft[1])
					.scale(() => a.fft[3] * 2),
				() => a.fft[0] / 2
			)
			.out();
		speed = 1;

		a.setSmooth(0.96);`
	},
	{
		artist: 'eerie_ear e_e',
		name: 'LINES',
		code:
		`n = 8;
		a = () =>
			shape(4, 0.25, 0.009)
				.rotate(() => time / -40)
				.repeat(n, n);
		a()
			.add(
				a()
					.scrollX(0.5 / n)
					.scrollY(0.5 / n),
				1
			)
			.modulate(o1, 0.1)
			.modulate(
				src(o1)
					.color(10, 10)
					.add(solid(-14, -14))
					.rotate(() => time / 40),
				0.005
			)
			.add(src(o1).scrollY(0.012, 0.02), 0.5)
			.out(o1);
		src(o1).colorama(1.2).posterize(4).saturate(0.7).contrast(6).mult(solid(), 0.15).out(o0);`
	},
	{
		artist: 'eerie_ear e_e',
		name: 'MULTIVERSE',
		code:
		`// time and feedback

		pat = () =>
			solid()
				.layer(
					solid().diff(
						osc((time / 16) * 1, (time / 1000) * 0.2)
							.mult(osc((time / 8) * 1, (time / 1006) * 0.2).rotate(1.57))
							.modulate(shape(106, 1, 0.05))
							.mult(shape(106, 1, 0.05))
					)
				)
				.modulateScale(osc(2, 0.125), 0.125);
		solid()
			.layer(
				solid(1, 1, 1)
					.mult(
						pat().diff(
							src(o0).scale(0.2).mult(solid(), [0.7, 0.6, 0.4, 0.6]).kaleid(1.01).saturate(0.3)
						)
					)
					.layer(
						solid(1, 1, 1)
							.mask(
								noise(2, 0.05)
									.invert()
									.colorama(2)
									.posterize(8, 4)
									.luma(0.25)
									.thresh(0.5)
									.modulateRotate(osc(1, 0.5))
							)
							.mult(
								gradient(0.5).kaleid(1).colorama(2).saturate(1.1).contrast(1.6).mult(solid(), 0.45)
							)
					)
			)
			.out();
		speed = 0.5;`
	},
	{
		artist: 'Flor de Fuego',
		code:
		`shape(200, 0.5, 1.5)
			.scale(0.5, 0.5)
			.color([0.5, 2].smooth(1), 0.3, 0)
			.repeat(2, 2)
			.modulateScale(osc(3, 0.5), -0.6)
			.add(o0, 0.5)
			.scale(0.9)
			.out();`
	},
	{
		artist: 'Flor de Fuego\nhttps://flordefuego.github.io',
		name: 'Glitch River',
		code:
		`voronoi(8, 1)
			.mult(
				osc(10, 0.1, () => Math.sin(time) * 3)
					.saturate(3)
					.kaleid(200)
			)
			.modulate(o0, 0.5)
			.add(o0, 0.8)
			.scrollY(-0.01)
			.scale(0.99)
			.modulate(voronoi(8, 1), 0.008)
			.luma(0.3)
			.out();

		speed = 0.1;`
	},
	{
		artist: 'Flor de Fuego\nhttps://flordefuego.github.io',
		name: 'Hydra Glitchy Slit Scan',
		code:
		`s0.initCam();

		src(s0)
			.saturate(2)
			.contrast(1.3)
			.layer(src(o0).mask(shape(4, 2).scale(0.5, 0.7).scrollX(0.25)).scrollX(0.001))
			.modulate(o0, 0.001)
			.out(o0);`
	},
	{
		artist: 'Flor de Fuego\nhttps://flordefuego.github.io',
		code:
		`osc(30, 0.01, 1)
			.mult(osc(20, -0.1, 1).modulate(noise(3, 1)).rotate(0.7))
			.posterize([3, 10, 2].fast(0.5).smooth(1))
			.modulateRotate(o0, () => mouse.x * 0.003)
			.out();`
	},
	{
		artist: 'Mahalia H-R',
		name: 'Cellular & Blobular',
		code:
		`speed = 0.3;

		shape(20, 0.2, 0.3)
			.color(0.5, 0.8, 50)
			.scale(() => Math.sin(time) + 1 * 2)
			.repeat(() => Math.sin(time) * 10)
			.modulateRotate(o0)
			.scale(() => Math.sin(time) + 1 * 1.5)
			.modulate(noise(2, 2))
			.rotate(1, 0.2)
			// .invert(2.4)
			.out(o0);`
	},
	{
		artist: 'Mahalia H-R',
		name: 'Velvet Pool',
		code:
		`noise()
			.color(() => a.fft[2] * 2, 0, 0.6)
			.modulate(noise(() => a.fft[0] * 10))
			.scale(() => a.fft[2] * 5)
			.layer(
				src(o0)
					.mask(osc(10).modulateRotate(osc(), 90, 0))
					.scale(() => a.fft[0] * 2)
					.luma(0.2, 0.3)
			)
			.blend(o0)
			.out(o0);

		osc()
			.modulate(noise(() => a.fft[1] + 5))
			.color(1, 0, 0)
			.out(o1);

		src(o0)
			.modulate(o1)
			.layer(src(o1).mask(o1).saturate(7))
			.modulateRotate(o1)
			.rotate(({ time }) => (time % 360) * 0.05)
			.out(o2);

		render(o2);`
	},
	{
		artist: 'Mahalia H-R',
		code:
		`shape(20, 0.1, 0.01)
			.scale(() => Math.sin(time) * 3)
			.repeat(() => Math.sin(time) * 10)
			.modulateRotate(o0)
			.scale(() => Math.sin(time) * 2)
			.modulate(noise(2, 0))
			.rotate(0.1, 0.9)
			.out(o0);

		src(o0)
			.modulate(osc(500, 0, 0))
			.out(o1);

		src(o1)
			.modulateKaleid(
				voronoi(() => Math.sin(time) * 3, 0.1, 0.01),
				() => Math.sin(time) * 3
			)
			.scale(() => Math.sin(time) * 3)
			.out(o2);

		render(o2);`
	},
	{
		artist: 'Mahalia H-R',
		code:
		`shape(() => Math.sin(time) + 1 * 2)
			.rotate(() => (Math.PI * mouse.x) / 180)
			.repeatX(3)
			.repeatY(() => Math.sin(time) * 5)
			.scale(() => Math.PI / 4)
			.blend(src(o0).color(1, 0, 0))
			.modulate(osc(20, 0, 0.4))
			.kaleid(2)
			.out(o0);

		render(o0);`
	},
	{
		artist: 'Mahalia H-R',
		code:
		`shape(() => Math.sin(time) + 1 * 3, 0.5, 0.01)
			.repeat(
				5,
				3,
				() => a.fft[0] * 2,
				() => a.fft[1] * 2
			)
			.scrollY(0.5, 0.1)
			.layer(src(o1).mask(o0).luma(0.01, 0.1).invert(0.2))
			.modulate(o1, 0.02)
			.out(o0);

		osc(40, 0.09, 0.9).color(0.9, 0, 5).modulate(osc(10).rotate(1, 0.5)).rotate(1, 0.2).out(o1);

		render(o0);`
	},
	{
		artist: 'Marianne Teixido\nhttps://marianneteixido.github.io',
		name: 'Pixelscape',
		code:
		`src(o0)
			.saturate(1.01)
			.scale(0.999)
			.color(1.01, 1.01, 1.01)
			.hue(0.01)
			.modulateHue(src(o1).hue(0.3).posterize(-1).contrast(0.7), 2)
			.layer(src(o1).luma().mult(gradient(1).saturate(0.9)))
			.out(o0);

		noise(1, 0.2).rotate(2, 0.5).layer(src(o0).scrollX(0.2)).out(o1);

		render(o0);`
	},
	{
		artist: 'Marianne Teixido\nhttps://marianneteixido.github.io',
		name: 'Port',
		code:
		`osc(5, 0.9, 0.001)
			.kaleid([3, 4, 5, 7, 8, 9, 10].fast(0.1))
			.color(0.5, 0.3)
			.colorama(0.4)
			.rotate(0.009, () => Math.sin(time) * -0.001)
			.modulateRotate(o0, () => Math.sin(time) * 0.003)
			.modulate(o0, 0.9)
			.scale(0.9)
			.out(o0);`
	},
	{
		artist: 'Naoto Hieda',
		code:
		`osc(20, 0.1, 0)
			.color(0, 1, 2)
			.rotate(1.57 / 2)
			.out(o1);

		osc(30, 0.01, 0).color(2, 0.7, 1).modulate(o1, 0).add(o1, 1).modulatePixelate(o1, 1, 10).out(o0);`
	},
	{
		artist: 'Naoto Hieda',
		code:
		`solid(0.2, 0.6, 0.9)
			.layer(osc(31.4, 0).thresh(0.7).luma().modulate(osc(4, 1).rotate(1), 0.05).color(0, 0, 0))
			.layer(osc(31.4, 0).thresh(0.7).luma().modulate(osc(4, 1).rotate(1), 0.1))
			.out();`
	},
	{
		artist: 'Nelson Vera',
		code:
		`osc(8, -0.5, 1)
			.color(-1.5, -1.5, -1.5)
			.blend(o0)
			.rotate(-0.5, -0.5)
			.modulate(
				shape(4)
					.rotate(0.5, 0.5)
					.scale(2)
					.repeatX(2, 2)
					.modulate(o0, () => mouse.x * 0.0005)
					.repeatY(2, 2)
			)
			.out(o0);`
	},
	{
		artist: 'Nesso\nhttps://nesso.xyz',
		name: 'Clouds of Passage',
		code:
		`shape([4, 5, 6].fast(0.1).smooth(1), 0.000001, [0.2, 0.7].smooth(1))
			.color(0.2, 0.4, 0.3)
			.scrollX(() => Math.sin(time * 0.27))
			.add(
				shape([4, 5, 6].fast(0.1).smooth(1), 0.000001, [0.2, 0.7, 0.5, 0.3].smooth(1))
					.color(0.6, 0.2, 0.5)
					.scrollY(0.35)
					.scrollX(() => Math.sin(time * 0.33))
			)
			.add(
				shape([4, 5, 6].fast(0.1).smooth(1), 0.000001, [0.2, 0.7, 0.3].smooth(1))
					.color(0.2, 0.4, 0.6)
					.scrollY(-0.35)
					.scrollX(() => Math.sin(time * 0.41) * -1)
			)
			.add(
				src(o0)
					.shift(0.001, 0.01, 0.001)
					.scrollX([0.05, -0.05].fast(0.1).smooth(1))
					.scale([1.05, 0.9].fast(0.3).smooth(1), [1.05, 0.9, 1].fast(0.29).smooth(1)),
				0.85
			)
			.modulate(voronoi(10, 2, 2))
			.out();`
	},
	{
		artist: 'Olivia Jack',
		code:
		`osc(20, 0.03, 1.7)
			.kaleid()
			.mult(osc(20, 0.001, 0).rotate(1.58))
			.blend(o0, 0.94)
			.modulateScale(osc(10, 0), -0.03)
			.scale(0.8, () => 1.05 + 0.1 * Math.sin(0.05 * time))
			.out(o0);`
	},
	{
		artist: 'Olivia Jack\nhttps://ojack.github.io',
		name: 'Moire',
		code:
		`pattern = () => osc(200, 0).kaleid(200).scale(1, 0.4);

		pattern().scrollX(0.1, 0.01).mult(pattern()).out();`
	},
	{
		artist: 'Olivia Jack\nhttps://ojack.github.io',
		code:
		`osc(20, 0.01, 1.1)
			.kaleid(5)
			.color(2.83, 0.91, 0.39)
			.rotate(0, 0.1)
			.modulate(o0, () => mouse.x * 0.0003)
			.scale(1.01)
			.out(o0);`
	},
	{
		artist: 'Olivia Jack\nhttps://ojack.github.io',
		code:
		`osc(100, 0.01, 1.4)
			.rotate(0, 0.1)
			.mult(osc(10, 0.1).modulate(osc(10).rotate(0, -0.1), 1))
			.color(2.83, 0.91, 0.39)
			.out(o0);`
	},
	{
		artist: 'Olivia Jack\nhttps://ojack.github.io',
		code:
		`osc(4, 0.1, 0.8)
			.color(1.04, 0, -1.1)
			.rotate(0.3, 0.1)
			.pixelate(2, 20)
			.modulate(noise(2.5), () => 1.5 * Math.sin(0.08 * time))
			.out(o0);`
	},
	{
		artist: 'Olivia Jack\nhttps://ojack.github.io',
		code:
		`osc(6, 0, 0.8)
			.color(1.14, 0.6, 0.8)
			.rotate(0.92, 0.3)
			.pixelate(20, 10)
			.mult(osc(40, 0.03).thresh(0.4).rotate(0, -0.02))
			.modulateRotate(osc(20, 0).thresh(0.3, 0.6), () => 0.1 + mouse.x * 0.002)
			.out(o0);`
	},
	{
		artist: 'Rangga Purnama Aji',
		name: 'Dreamy Diamond',
		code:
		`osc(7, -0.125)
			.modulate(voronoi(1))
			.diff(voronoi(1).mult(gradient(-1).luma(0.125)))
			.luma(0.125)
			.add(shape(7, 0.5).mult(voronoi(10, 2).blend(o0).diff(gradient(1)).modulate(voronoi())))
			.scrollY(-0.1)
			.scrollX(0.125)
			.blend(o0)
			.blend(o0)
			.out();`
	},
	{
		artist: 'Rangga Purnama Aji',
		name: 'Galaxy Trip',
		code:
		`shape(1, 1)
			.mult(voronoi(1000, 2).blend(o0).luma())
			.add(shape(3, 0.125).rotate(1, 1).mult(voronoi(1000, 1).luma()).rotate(1.5))
			.scrollX([0.1, -0.0625, 0.005, 0.00001], 0)
			.scrollY([0.1, -0.0625, 0.005, 0.00001], 0)
			.out();`
	},
	{
		artist: 'Rangga Purnama Aji',
		name: 'Monochrome Memoar',
		code:
		`voronoi(50, 1)
			.luma(0.5)
			.add(shape(1, 1).luma(1))
			.modulate(osc(-1000, -1).modulate(osc().luma()))
			.blend(o0)
			.blend(o0)
			.blend(o0)
			.blend(o0)
			.out();`
	},
	{
		artist: 'Rangga Purnama Aji',
		name: 'Sumet',
		code:
		`osc(0.5, 1.25)
			.mult(shape(1, 0.09).rotate(1.5))
			.diff(gradient())
			.add(shape(2, 2).blend(gradient(1)))
			.modulate(noise().modulate(noise().scrollY(1, 0.0625)))
			.blend(o0)
			.color(1, -0.5, -0.75)
			.out();`
	},
	{
		artist: 'Rangga Purnama Aji',
		name: 'Tag & Sweep',
		code:
		`osc(5, 0.125)
			.colorama(1)
			.luma(0.125)
			.add(shape(1, 0.5).luma(2).diff(gradient(1)))
			.diff(osc(-1, -0.25))
			.blend(o0)
			.color(0, 2.5, 1.75)
			.out();`
	},
	{
		artist: 'Ritchse',
		name: 'Corrupted Screensaver',
		code:
		`voronoi(350, 0.15)
			.modulateScale(osc(8).rotate(Math.sin(time)), 0.5)
			.thresh(0.8)
			.modulateRotate(osc(7), 0.4)
			.thresh(0.7)
			.diff(src(o0).scale(1.8))
			.modulateScale(osc(2).modulateRotate(o0, 0.74))
			.diff(
				src(o0)
					.rotate([-0.012, 0.01, -0.002, 0])
					.scrollY(0, [-1 / 199800, 0].fast(0.7))
			)
			.brightness([-0.02, -0.17].smooth().fast(0.5))
			.out();`
	},
	{
		artist: 'Ritchse',
		name: 'Disintegration',
		code:
		`osc(5, 0.1)
			.modulate(noise(6), 0.22)
			.diff(o0)
			.modulateScrollY(osc(2).modulate(osc().rotate(), 0.11))
			.scale(0.72)
			.color(0.99, 1.014, 1)
			.out();`
	},
	{
		artist: 'Ritchse',
		name: 'Random Trypophobia',
		code:
		`// changes everytime you load it!

		function r(min = 0, max = 1) {
			return Math.random() * (max - min) + min;
		}

		solid(1, 1, 1)
			.diff(shape([4, 4, 4, 24].smooth().fast(0.5), r(0.6, 0.93), 0.09).repeat(20, 10))
			.modulateScale(osc(8).rotate(r(-0.5, 0.5)), 0.52)
			.add(
				src(o0)
					.scale(0.965)
					.rotate(0.012 * Math.round(r(-2, 1)))
					.color(r(), r(), r())
					.modulateRotate(o0, r(0, 0.5))
					.brightness(0.15),
				0.7
			)
			.out();`
	},
	{
		artist: 'Ritchse',
		name: 'Tropical Juice',
		code:
		`voronoi(2, 0.3, 0.2)
			.shift(0.5)
			.modulatePixelate(voronoi(4, 0.2), 32, 2)
			.scale(() => 1 + Math.sin(time * 2.5) * 0.05)
			.diff(voronoi(3).shift(0.6))
			.diff(osc(2, 0.15, 1.1).rotate())
			.brightness(0.1)
			.contrast(1.2)
			.saturate(1.2)
			.out();

		speed = 0.8;`
	},
	{
		artist: 'Ritchse',
		name: 'Trying To Get Closer',
		code:
		`osc(60, -0.015, 0.3)
			.diff(osc(60, 0.08).rotate(Math.PI / 2))
			.modulateScale(noise(3.5, 0.25).modulateScale(osc(15).rotate(() => Math.sin(time / 2))), 0.6)
			.color(1, 0.5, 0.4)
			.contrast(1.4)
			.add(src(o0).modulate(o0, 0.04), 0.6)
			.invert()
			.brightness(0.1)
			.contrast(1.2)
			.modulateScale(osc(2), -0.2)
			.out();`
	},
	{
		artist: 'Rodrigo Velasco\nhttps://yecto.github.io',
		code:
		`osc(107, 0, 0.7).color(1, 0, 1).rotate(0, -0.08).modulateRotate(o1, 0.4).out(o0);

		osc(33)
			.rotate(2, 0.8)
			.modulateRotate(o0, () => a.fft[0] * 2)
			.out(o1);`
	},
	{
		artist: 'Rodrigo Velasco\nhttps://yecto.github.io',
		code:
		`osc(18, 0.1, 0)
			.color(2, 0.1, 2)
			.mult(osc(20, 0.01, 0))
			.repeat(2, 20)
			.rotate(0.5)
			.modulate(o1)
			.scale(1, () => a.fft[0] * 0.9 + 2)
			.diff(o1)
			.out(o0);

		osc(20, 0.2, 0).color(2, 0.7, 0.1).mult(osc(40)).modulateRotate(o0, 0.2).rotate(0.2).out(o1);`
	},
	{
		artist: 'Will Humphreys\nhttps://github.com/TheWispy',
		name: 'Acid Bus Seat',
		code:
		`osc(105)
			.color(0.5, 0.1, 0.8)
			.rotate(0.11, 0.1)
			.modulate(osc(10).rotate(0.3).add(o0, 0.1))
			.add(osc(20, 0.01, 1).color(0, 0.8, 1))
			.out(o0);

		osc(50, 0.05, 0.7).color(1, 0.7, 0.5).diff(o0).modulate(o1, 0.05).out(o1);

		render(o1);`
	},
	{
		artist: 'Zach Krall',
		code:
		`osc(215, 0.1, 2)
			.modulate(osc(2, -0.3, 100).rotate(15))
			.mult(osc(215, -0.1, 2).pixelate(50, 50))
			.color(0.9, 0.0, 0.9)
			.modulate(osc(6, -0.1).rotate(9))
			.add(osc(10, -0.9, 900).color(1, 0, 1))
			.mult(shape(900, 0.2, 1).luma().repeatX(2).repeatY(2).colorama(10))
			.modulate(osc(9, -0.3, 900).rotate(6))
			.add(osc(4, 1, 90).color(0.2, 0, 1))
			.out();`
	},
	{
		artist: 'Zach Krall',
		code:
		`osc(10, 0.9, 300)
			.color(0.9, 0.7, 0.8)
			.diff(osc(45, 0.3, 100).color(0.9, 0.9, 0.9).rotate(0.18).pixelate(12).kaleid())
			.scrollX(10)
			.colorama()
			.luma()
			.repeatX(4)
			.repeatY(4)
			.modulate(osc(1, -0.9, 300))
			.scale(2)
			.out();`
	}
].map((e, i) => ({
	name: `${e.name ?? `Sketch ${i + 1}`}`,
	code: `// by ${e.artist.split('\n').join('\n// ')}\n\n` + e.code.replace(/^\t{2}/gm, '')
}));

export function getSketch(index: number): SelectedSketch {
	const len = sketches.length;
	if (len === 0) {
		return { name: '', code: '', index: -1 };
	}
	const i = ((index % len) + len) % len;
	const ex = sketches[i]!;
	return { index: i, name: ex.name, code: ex.code };
}

export function getRandomSketch(exclude = -1): SelectedSketch {
	let i = Math.floor(Math.random() * sketches.length);
	while (i === exclude) {
		i = Math.floor(Math.random() * sketches.length);
	}
	return getSketch(i);
}
