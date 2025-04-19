import { motion } from "framer-motion";

export default function FlashCard({ fact, onAnswer }) {
  const handleSubmit = e => {
    e.preventDefault();
    const form = e.target;
    const value = Number(form.elements.answer.value);
    onAnswer(value);
    form.reset();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-56 p-6 bg-white rounded-2xl shadow-xl flex flex-col items-center gap-4"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div className="text-4xl font-bold">
        {fact.i} × {fact.j} = ?
      </div>
      <input
        name="answer"
        type="number"
        required
        autoFocus
        className="w-full text-center border rounded-lg p-2 focus:outline-none focus:ring"
      />
      <button
        type="submit"
        className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
      >
        Проверка
      </button>
    </motion.form>
  );
}
