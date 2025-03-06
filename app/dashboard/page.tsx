"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, logout, addHabit, deleteHabit, markHabitCompleted, removeHabitCompletion, getHabitData, getAllHabits } from "../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus, Trash2, LogOut, Award, BarChart3, Menu } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<{ name: string }[]>([]);
  const [selectedHabit, setSelectedHabit] = useState("");
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setUser(user);
        try {
          const habitList = await getAllHabits(user.uid);
          setHabits(habitList.map(h => ({ name: h.habitName })));
          if (habitList.length > 0) {
            setSelectedHabit(habitList[0].habitName);
            setCompletedDates(habitList[0].completedDates || []);
          }
        } catch (error) {
          console.error("Error fetching habits:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && selectedHabit) {
      getHabitData(user.uid, selectedHabit).then((habitData) => {
        if (habitData) {
          setCompletedDates(habitData.completedDates || []);
        }
      });
    }
  }, [selectedHabit, user]);

  const handleAddHabit = async () => {
    if (!newHabit.trim() || !user) return;

    try {
      await addHabit(user.uid, newHabit);
      setHabits(prev => [...prev, { name: newHabit }]);
      setSelectedHabit(newHabit);
      setNewHabit("");
      setShowModal(false);
      console.log(`Habit "${newHabit}" added successfully.`);
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  const handleViewReport = () => {
    router.push("/report"); // Navigate to the report page
  };

  const handleDeleteHabit = async (habitName: string) => {
    if (!user) return;
    try {
      await deleteHabit(user.uid, habitName);
      setHabits(prev => prev.filter(h => h.name !== habitName));
      if (selectedHabit === habitName) {
        setSelectedHabit(habits.length > 1 ? habits[0].name : "");
        setCompletedDates([]);
      }
      console.log(`Habit "${habitName}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleDateClick = async (info: any) => {
    if (!user || !selectedHabit) return;
    const clickedDate = format(info.date, "yyyy-MM-dd");
    console.log("Date clicked:", clickedDate);

    try {
      if (completedDates.includes(clickedDate)) {
        await removeHabitCompletion(user.uid, selectedHabit, clickedDate);
        setCompletedDates(prev => prev.filter(date => date !== clickedDate));
      } else {
        await markHabitCompleted(user.uid, selectedHabit, clickedDate);
        setCompletedDates(prev => [...prev, clickedDate]);
      }
      setCalendarKey(prevKey => prevKey + 1); // Forces re-render
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    }
  };

  const handleEventClick = async (info: any) => {
    if (!user || !selectedHabit) return;
    const clickedDate = format(info.event.start, "yyyy-MM-dd");
    console.log("Event clicked:", clickedDate);

    try {
      await removeHabitCompletion(user.uid, selectedHabit, clickedDate);
      setCompletedDates(prev => prev.filter(date => date !== clickedDate));
      setCalendarKey(prevKey => prevKey + 1); // Forces re-render
    } catch (error) {
      console.error("Error removing habit completion:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-2 sm:p-6 flex justify-center items-center">
      <div className="w-full max-w-xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 sm:p-5">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl sm:text-3xl font-bold text-white">Habit Tracker</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
              <button
                onClick={toggleMenu}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 md:hidden"
                title="Menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={`flex justify-between p-2 sm:p-3 bg-gray-700/50 border-b border-gray-600 ${isMenuOpen ? 'block' : 'flex md:flex hidden'}`}>
          <div className="flex items-center space-x-2">
            <Award className="text-yellow-400" size={16} />
            <span className="text-xs sm:text-sm text-gray-200">
              {completedDates.length} Days Completed
            </span>
          </div>
          <button
            onClick={handleViewReport}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-lg transition-all text-xs sm:text-sm"
          >
            <BarChart3 size={14} />
            <span>View Report</span>
          </button>
        </div>

        {/* Habit Selection */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-700/30">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {habits.map((habit, index) => (
              <div
                key={index}
                className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 text-xs sm:text-sm ${
                  selectedHabit === habit.name
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                <span
                  className="cursor-pointer mr-1 sm:mr-2 truncate max-w-32 sm:max-w-full"
                  onClick={() => setSelectedHabit(habit.name)}
                >
                  {habit.name}
                </span>
                <Trash2
                  className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer text-gray-300 hover:text-red-400 flex-shrink-0"
                  onClick={() => handleDeleteHabit(habit.name)}
                />
              </div>
            ))}
            <button
              className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-full transition-all duration-200 shadow-lg shadow-green-500/20"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-2 sm:p-4">
          <div className="calendar-container bg-gray-700/40 rounded-lg overflow-hidden shadow-inner">
            <FullCalendar
              key={calendarKey}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={completedDates.map(date => ({
                title: "✅",
                start: date,
                allDay: true,
                color: "#22c55e", // Green-500
                borderColor: "#16a34a", // Green-600
                textColor: "white"
              }))}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="auto"
              headerToolbar={{
                left: 'prev',
                center: 'title',
                right: 'next'
              }}
              buttonText={{
                today: 'Today'
              }}
              dayMaxEvents={1}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              contentHeight="auto"
              aspectRatio={1.35}
              fixedWeekCount={false}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-2 sm:p-4 bg-indigo-900/30 border-t border-gray-600/50 text-xs sm:text-sm text-gray-300">
          <p className="flex items-center">
            <span className="mr-1 sm:mr-2">📅</span>
            Click on a date to mark/unmark your habit as completed
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm border border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Add New Habit</h2>
            <input
              type="text"
              className="w-full p-2 sm:p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm sm:text-base"
              placeholder="Enter habit name"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="flex justify-end mt-4 sm:mt-6 space-x-2 sm:space-x-3">
              <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors shadow-lg shadow-green-500/30 text-sm sm:text-base"
                onClick={handleAddHabit}
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}