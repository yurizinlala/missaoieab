import { useEffect, useState } from 'react';

export const useAnimatedNumber = (target: number, duration: number = 1000) => {
    const [current, setCurrent] = useState(target);

    useEffect(() => {
        const start = current;
        const diff = target - start;
        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const newValue = Math.round(start + diff * easeOut);
            setCurrent(newValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return current;
};
