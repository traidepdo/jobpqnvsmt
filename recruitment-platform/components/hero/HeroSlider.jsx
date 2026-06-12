// src/app/_components/Hero/HeroSlider.js
export function HeroSlider({ images, heroImg, scrollY }) {
    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ transform: `translate3d(0, ${scrollY * 0.4}px, 0)`, willChange: 'transform' }}
        >
            {images.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms]"
                    style={{ opacity: i === heroImg ? 0.08 : 0 }}
                />
            ))}
        </div>
    );
}