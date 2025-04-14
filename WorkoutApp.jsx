
// 향후 루틴 구조 확장을 위한 준비 - '운동 그룹'을 '동작'의 집합으로 유지하고, 상위에 루틴 추가
import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Play, Pause, RotateCcw, XCircle } from "lucide-react";

export default function WorkoutApp() {
  const [routines, setRoutines] = useState([]); // 루틴 배열
  const [currentRoutine, setCurrentRoutine] = useState(null); // 선택된 루틴
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    groups: [
      {
        name: "",
        motions: [
          {
            name: "",
            startPrompt: "",
            startDelay: 1,
            count: 10,
            interval: 1,
            sets: 1,
            restTime: 5,
            restPrompt: "수고하셨습니다!",
          },
        ],
      },
    ],
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cancelWorkout, setCancelWorkout] = useState(false);
  const [progressText, setProgressText] = useState("");
  const ttsRef = useRef(null);
  const isPausedRef = useRef(false);
  const cancelWorkoutRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    cancelWorkoutRef.current = cancelWorkout;
  }, [cancelWorkout]);

  const handleInputChange = (e, gIdx = 0, mIdx = 0) => {
    const { name, value } = e.target;
    const numericFields = ["startDelay", "count", "interval", "sets", "restTime"];
    const updatedGroups = [...formData.groups];
    updatedGroups[gIdx].motions[mIdx] = {
      ...updatedGroups[gIdx].motions[mIdx],
      [name]: numericFields.includes(name) ? parseFloat(value) : value,
    };
    setFormData((prev) => ({ ...prev, groups: updatedGroups }));
  };

  const handleAddOrUpdate = () => {
    if (currentRoutine !== null) {
      const updated = [...routines];
      updated[currentRoutine] = formData;
      setRoutines(updated);
    } else {
      setRoutines([...routines, formData]);
    }
    setFormData({
      name: "",
      groups: [
        {
          name: "",
          motions: [formData.groups[0].motions[0]]
        },
      ],
    });
    setShowForm(false);
    setCurrentRoutine(null);
  };

  const handleEdit = (index) => {
    setCurrentRoutine(index);
    setFormData(routines[index]);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    const updated = [...routines];
    updated.splice(index, 1);
    setRoutines(updated);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      groups: [
        {
          name: "",
          motions: [{ ...formData.groups[0].motions[0] }],
        },
      ],
    });
    setShowForm(false);
    setCurrentRoutine(null);
  };

  const speak = (text) => {
    if (ttsRef.current) {
      window.speechSynthesis.cancel();
    }
    const msg = new SpeechSynthesisUtterance(text);
    ttsRef.current = msg;
    window.speechSynthesis.speak(msg);
  };

  const waitFor = (ms) => new Promise((res) => setTimeout(res, ms));

  const waitWhilePausedOrCancelled = async () => {
    while (isPausedRef.current) {
      await waitFor(200);
    }
    return !cancelWorkoutRef.current;
  };

  const runRoutine = async (routine) => {
    setIsRunning(true);
    setCancelWorkout(false);
    cancelWorkoutRef.current = false;

    for (const group of routine.groups) {
      for (const motion of group.motions) {
        setProgressText(`${motion.name} 시작 전 준비…`);
        speak(motion.startPrompt);
        await waitFor(motion.startDelay * 1000);

        for (let set = 1; set <= motion.sets; set++) {
          for (let i = 1; i <= motion.count; i++) {
            if (cancelWorkoutRef.current) break;
            setProgressText(`${motion.name} - ${set}세트 ${i}회`);
            speak(i.toString());
            for (let t = 0; t < motion.interval * 1000; t += 200) {
              if (!(await waitWhilePausedOrCancelled())) return;
              await waitFor(200);
            }
          }
          if (set < motion.sets && !cancelWorkoutRef.current) {
            setProgressText(`휴식 중…`);
            speak("세트 완료");
            speak(motion.restPrompt);
            for (let t = 0; t < motion.restTime * 1000; t += 200) {
              if (!(await waitWhilePausedOrCancelled())) return;
              await waitFor(200);
            }
            speak("다시 시작합니다. 준비해 주세요.");
          } else if (set === motion.sets) {
            speak("세트 완료");
          }
        }
      }
    }

    if (!cancelWorkoutRef.current) {
      setProgressText("운동 완료!");
      speak("운동이 완료되었습니다");
    }
    setIsRunning(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-700">승곡 헬스 도우미</h1>

      {!isRunning && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl"
        >
          + 루틴 추가
        </button>
      )}

      {/* 루틴 목록 표시 및 실행, 폼 등은 이후 계속 확장 가능 */}
    </div>
  );
}
