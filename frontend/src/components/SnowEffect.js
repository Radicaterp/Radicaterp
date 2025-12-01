import { useEffect } from 'react';

const SnowEffect = () => {
  useEffect(() => {
    // Create snowflakes
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');
      snowflake.innerHTML = '❄';
      snowflake.style.left = Math.random() * window.innerWidth + 'px';
      snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
      snowflake.style.opacity = Math.random();
      snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
      
      document.getElementById('snow-container').appendChild(snowflake);
      
      setTimeout(() => {
        snowflake.remove();
      }, 5000);
    };
    
    // Create snowflakes periodically
    const interval = setInterval(createSnowflake, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      id="snow-container" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
};

export default SnowEffect;
