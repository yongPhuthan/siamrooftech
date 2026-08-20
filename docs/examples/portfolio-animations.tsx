// Example: Portfolio animations with React Spring v9.7
import { useSpring, animated, useInView } from '@react-spring/web';
import Image from 'next/image';

interface AnimatedPortfolioCardProps {
  title: string;
  description: string;
  image: string;
}

export default function AnimatedPortfolioCard({ 
  title, 
  description, 
  image 
}: AnimatedPortfolioCardProps) {
  const [ref, inView] = useInView({
    once: true,
  });

  const cardAnimation = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 },
  });

  const imageAnimation = useSpring({
    transform: inView ? 'scale(1)' : 'scale(0.8)',
    config: { tension: 200, friction: 50 },
  });

  return (
    <animated.div ref={ref} style={cardAnimation}>
      <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-xl">
        <animated.div className="relative h-[300px] w-full" style={imageAnimation}>
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </animated.div>
        <div className="space-y-2 p-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
      </article>
    </animated.div>
  );
}
