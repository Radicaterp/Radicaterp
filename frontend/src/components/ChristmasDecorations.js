import { useEffect, useState } from 'react';

const ChristmasDecorations = () => {
  const [lights, setLights] = useState([]);

  useEffect(() => {
    // Create Christmas lights at top of screen
    const createLights = () => {
      const newLights = [];
      const numberOfLights = 30;
      
      for (let i = 0; i < numberOfLights; i++) {
        newLights.push({
          id: i,
          left: `${(i / numberOfLights) * 100}%`,
          color: i % 3 === 0 ? '#ff0000' : i % 3 === 1 ? '#00ff00' : '#ffd700',
          delay: `${Math.random() * 2}s`
        });
      }
      
      setLights(newLights);
    };
    
    createLights();
  }, []);

  return (
    <>
      {/* Christmas Lights */}
      <div className="fixed top-0 left-0 w-full h-16 pointer-events-none z-40 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Wire */}
          <div className="absolute top-4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          
          {/* Lights */}
          {lights.map((light) => (
            <div
              key={light.id}
              className="absolute top-4 w-3 h-6 rounded-full"
              style={{
                left: light.left,
                backgroundColor: light.color,
                boxShadow: `0 0 20px ${light.color}`,
                animation: `twinkle 1.5s infinite`,
                animationDelay: light.delay,
                transform: 'translateX(-50%)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Christmas Ornaments in corners */}
      <div className="fixed top-20 left-6 text-6xl pointer-events-none z-30 animate-bounce" style={{animationDuration: '3s'}}>
        🎁
      </div>
      <div className="fixed top-20 right-6 text-6xl pointer-events-none z-30 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
        🎄
      </div>
      <div className="fixed bottom-20 left-6 text-6xl pointer-events-none z-30 animate-bounce" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}>
        ⛄
      </div>
      <div className="fixed bottom-20 right-6 text-6xl pointer-events-none z-30 animate-bounce" style={{animationDuration: '4s'}}>
        🎅
      </div>

      {/* Candy Canes */}
      <div className="fixed top-1/4 left-2 text-4xl pointer-events-none z-30 rotate-12">
        🍭
      </div>
      <div className="fixed top-1/4 right-2 text-4xl pointer-events-none z-30 -rotate-12">
        🍭
      </div>
    </>
  );
};

export default ChristmasDecorations;
