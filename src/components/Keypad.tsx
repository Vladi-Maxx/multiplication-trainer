import React from 'react'

interface KeypadProps {
  value: string
  setValue: (val: string) => void
  onSubmit: () => void
}

export default function Keypad({ value, setValue, onSubmit }: KeypadProps) {
  const createRipple = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }
    button.appendChild(circle);
  };

  const handleKey = (k: string, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    createRipple(e);
    if (k === 'OK') onSubmit()
    else if (k === '⌫') setValue(value.slice(0, -1))
    else setValue(value + k)
  }

  return (
    <div className="keypad">
      {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map((k, i) => (
        <button
          key={i}
          type={k === 'OK' ? 'submit' : 'button'}
          className={`key${k === 'OK' ? ' submit' : ''}`}
          onClick={e => { e.preventDefault(); handleKey(k, e) }}
        >
          {k === 'OK' ? 'Изпрати' : k}
        </button>
      ))}
    </div>
  )
}
