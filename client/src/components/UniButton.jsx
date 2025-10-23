// src/components/UniVerseButton.jsx

const UniVerseButton = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        relative px-8 py-3 font-bold text-white bg-space-dark rounded-lg 
        overflow-hidden
        transition-all duration-300
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500
        before:bg-[length:400%_400%]
        before:opacity-0 hover:before:opacity-30
        before:transition-opacity before:duration-500
        before:animate-aurora
      "
    >
      {/* O span é necessário para que o texto fique por cima do efeito */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default UniVerseButton;