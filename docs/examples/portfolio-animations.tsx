// Example: Portfolio animations with React Spring v9.7
import { useSpring, animated, useInView } from '@react-spring/web';
import { Box, Typography } from '@mui/material';

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
      <Box sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <animated.img
          src={image}
          alt={title}
          style={{
            width: '100%',
            height: 300,
            objectFit: 'cover',
            ...imageAnimation,
          }}
        />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </animated.div>
  );
}
