import { useState, useEffect } from "react";

export default function WorkoutApp() {
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem("workouts");
    return saved ? JSON.parse(saved) : [];
  });
  const [exerciseName, setExerciseName] = useState("");
  const [countInput, setCountInput] = useState(10);
  const [setsInput, setSetsInput] = useState(3);
  const [restInput, setRestInput] = useState(30);
  const [intervalInput, setIntervalInput] = useState(1);
  const [restMessageInput, setRestMessageInput] = useState("휴식 시간입니다. 잠시 쉬세요");

  const [currentSet, setCurrentSet] = useState(1);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [count, setCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    let interval;
    if (running && !paused && workouts.length > 0) {
      const intervalMs = (workouts[currentExercise].interval || 1) * 1000;
      if (!isResting && count < workouts[currentExercise].count) {
        interval = setInterval(() => {
          setCount((prev) => {
            speak(`${prev + 1}`);
            return prev + 1;
          });
        }, intervalMs);
      } else if (!isResting && count >= workouts[currentExercise].count) {
        clearInterval(interval);
        if (currentSet < workouts[currentExercise].sets) {
          setIsResting(true);
          setTimer(workouts[currentExercise].rest);
          speak(workouts[currentExercise].restMessage || "휴식 시간입니다. 잠시 쉬세요");
        } else {
          moveToNextExercise();
        }
      }
      if (isResting && timer > 0) {
        interval = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
      } else if (isResting && timer <= 0) {
        clearInterval(interval);
        setIsResting(false);
        setCount(0);
        setCurrentSet((prev) => prev + 1);
      }
    }
    return () => clearInterval(interval);
  }, [count, timer, isResting, running, paused]);

  function moveToNextExercise() {
    if (currentExercise < workouts.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      setCurrentSet(1);
      setCount(0);
    } else {
      speak("운동 완료! 수고하셨습니다!");
      setRunning(false);
    }
  }

  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }

  function addWorkout() {
    if (!exerciseName.trim()) return;
    setWorkouts((prev) => [
      ...prev,
      {
        name: exerciseName,
        count: Number(countInput),
        sets: Number(setsInput),
        rest: Number(restInput),
        interval: Number(intervalInput),
        restMessage: restMessageInput,
      },
    ]);
    setExerciseName("");
    setCountInput(10);
    setSetsInput(3);
    setRestInput(30);
    setIntervalInput(1);
    setRestMessageInput("휴식 시간입니다. 잠시 쉬세요");
  }

  function deleteWorkout(index) {
    setWorkouts((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold mb-4">운동 도우미</h1>

      {!running && (
        <div className="space-y-2">
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="운동 이름"
            className="border p-2 w-full rounded"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              placeholder="횟수"
              className="border p-2 rounded"
            />
            <input
              type="number"
              value={setsInput}
              onChange={(e) => setSetsInput(e.target.value)}
              placeholder="세트 수"
              className="border p-2 rounded"
            />
            <input
              type="number"
              value={restInput}
              onChange={(e) => setRestInput(e.target.value)}
              placeholder="휴식(초)"
              className="border p-2 rounded"
            />
            <input
              type="number"
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              placeholder="간격(초)"
              className="border p-2 rounded"
            />
          </div>
          <input
            type="text"
            value={restMessageInput}
            onChange={(e) => setRestMessageInput(e.target.value)}
            placeholder="휴식 중 음성 문구"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={addWorkout}
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            운동 추가
          </button>

          <div className="text-left">
            <h2 className="font-semibold mt-4">운동 목록</h2>
            <ul className="list-disc pl-5 space-y-1">
              {workouts.map((w, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{w.name} - {w.count}회 × {w.sets}세트 (휴식 {w.rest}초, 간격 {w.interval ?? 1}초)</span>
                  <button
                    onClick={() => deleteWorkout(i)}
                    className="text-red-500 text-sm ml-2"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {workouts.length > 0 && (
            <button
              onClick={() => {
                setRunning(true);
                setPaused(false);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-2"
            >
              운동 시작하기
            </button>
          )}
        </div>
      )}

      {running && workouts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{workouts[currentExercise].name}</h2>
            <p>{currentSet}세트 / {workouts[currentExercise].sets}세트</p>
            {isResting ? (
              <p className="text-yellow-500">휴식 중: {timer}초</p>
            ) : (
              <p className="text-green-500">카운트: {count}</p>
            )}
          </div>
          <button
            onClick={() => setPaused(!paused)}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            {paused ? "계속하기" : "일시정지"}
          </button>
        </div>
      )}
    </div>
  );
}
