"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, logout, addHabit, deleteHabit, markHabitCompleted, removeHabitCompletion, getHabitData, getAllHabits } from "../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus, Trash2, LogOut } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<{ name: string }[]>([]);
  const [selectedHabit, setSelectedHabit] = useState("");
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);

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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-xl bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-gray-700">
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <button 
            onClick={handleLogout} 
            className="p-2 text-gray-300 hover:text-white rounded-full"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="px-4 py-3 bg-gray-700 border-t border-b border-gray-600">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {habits.map((habit, index) => (
              <div 
                key={index} 
                className={`flex items-center px-3 py-1.5 rounded-full transition-all duration-200 ${
                  selectedHabit === habit.name 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                <span 
                  className="cursor-pointer mr-2"
                  onClick={() => setSelectedHabit(habit.name)}
                >
                  {habit.name}
                </span>
                <Trash2 
                  className="w-4 h-4 cursor-pointer text-gray-300 hover:text-red-400" 
                  onClick={() => handleDeleteHabit(habit.name)}
                />
              </div>
            ))}
            <button
              className="flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-full transition-all duration-200"
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="calendar-container bg-gray-750 rounded-lg overflow-hidden">
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
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="p-4 bg-gray-700 border-t border-gray-600 text-sm text-gray-300">
          <p>📅 Click on a date to mark/unmark your habit as completed</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-96 relative border border-gray-600">
            <h2 className="text-xl font-bold text-white mb-4">Add New Habit</h2>
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter habit name"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="flex justify-end mt-6 space-x-3">
              <button
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
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