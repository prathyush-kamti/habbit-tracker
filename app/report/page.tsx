"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, getHabitStats } from "../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Bar, Line } from "react-chartjs-2";
import { Chart, registerables, ChartTypeRegistry } from "chart.js";
import { Calendar, ArrowLeft, Activity } from "lucide-react";

Chart.register(...registerables);

export default function Report() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [habitStats, setHabitStats] = useState<{ habitName: string; monthDays: number; yearDays: number; weekDays: number[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setUser(user);
        try {
          const stats = await getHabitStats(user.uid);
          setHabitStats(stats);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching habit stats:", error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Calculate completion rate
  const calculateCompletionRate = (monthDays: number, yearDays: number) => {
    const daysInMonth = new Date().getDate();
    const monthRate = Math.round((monthDays / daysInMonth) * 100);

    // Fix for TypeScript error - explicitly convert Date objects to numbers
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = Number(now) - Number(startOfYear);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const yearRate = Math.round((yearDays / dayOfYear) * 100);

    return { monthRate, yearRate };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-lg">Loading your habit data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-3 sm:p-6">
      <div className="w-full max-w-4xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 sm:mb-6 flex items-center text-indigo-300 hover:text-indigo-200 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="mr-1 sm:mr-2" size={16} />
          Back to Dashboard
        </button>

        <header className="flex justify-between items-center mb-4 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Your Habit Progress
            </h1>
          </div>
        </header>

        {habitStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-gray-800 rounded-xl p-4 sm:p-10 text-center">
            <Activity size={36} className="text-gray-500 mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold">No habits tracked yet</h2>
            <p className="text-gray-400 mt-2 mb-4 sm:mb-6 text-sm sm:text-base">Start tracking your habits to see detailed progress reports</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm sm:text-base"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-8">

            {habitStats.map((habit, index) => {
              const { monthRate, yearRate } = calculateCompletionRate(habit.monthDays, habit.yearDays);

              return (
                <div key={index} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  {/* Added a card title banner */}
                  <div className="bg-indigo-700 px-3 sm:px-5 py-2">
                    <h2 className="text-base sm:text-xl font-bold truncate">{habit.habitName} Report</h2>
                  </div>

                  <div className="p-3 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2 sm:mt-6">
                      <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center mb-1 sm:mb-2">
                          <Calendar size={16} className="text-indigo-400 mr-1 sm:mr-2" />
                          <h3 className="text-base sm:text-lg font-medium text-gray-200">Monthly</h3>
                        </div>
                        <div className="flex items-end">
                          <span className="text-xl sm:text-3xl font-bold text-white">{habit.monthDays}</span>
                          <span className="text-gray-400 ml-2 mb-1 text-xs sm:text-sm">/ {new Date().getDate()} days</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1.5 sm:h-2 mt-1 sm:mt-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 sm:h-2 rounded-full"
                            style={{ width: `${monthRate}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs sm:text-sm text-gray-300 mt-1">{monthRate}% complete</div>
                      </div>

                      <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center mb-1 sm:mb-2">
                          <Calendar size={16} className="text-purple-400 mr-1 sm:mr-2" />
                          <h3 className="text-base sm:text-lg font-medium text-gray-200">Yearly</h3>
                        </div>
                        <div className="flex items-end">
                          <span className="text-xl sm:text-3xl font-bold text-white">{habit.yearDays}</span>
                          <span className="text-gray-400 ml-2 mb-1 text-xs sm:text-sm">days this year</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1.5 sm:h-2 mt-1 sm:mt-2">
                          <div
                            className="bg-gradient-to-r from-purple-400 to-pink-500 h-1.5 sm:h-2 rounded-full"
                            style={{ width: `${yearRate}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs sm:text-sm text-gray-300 mt-1">{yearRate}% consistency</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-6 pt-0">
                    <div className="bg-gray-700/30 p-2 sm:p-4 rounded-lg h-48 sm:h-64">
                      {selectedTimeframe === "week" && (
                        <Bar
                          data={{
                            labels: habit.weekDays.slice(-7).map((_, i) => `W${habit.weekDays.length - 7 + i + 1}`),
                            datasets: [
                              {
                                label: "Days Completed",
                                data: habit.weekDays.slice(-7),
                                backgroundColor: "rgba(129, 140, 248, 0.6)",
                                borderColor: "rgba(129, 140, 248, 1)",
                                borderWidth: 1,
                                borderRadius: 4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  boxWidth: 12,
                                  padding: 10,
                                  font: {
                                    size: 10,
                                  }
                                },
                              },
                              tooltip: {
                                titleFont: {
                                  size: 10,
                                },
                                bodyFont: {
                                  size: 10,
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 7,
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  font: {
                                    size: 9,
                                  }
                                },
                                grid: {
                                  color: "rgba(255, 255, 255, 0.1)",
                                }
                              },
                              x: {
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  font: {
                                    size: 9,
                                  }
                                },
                                grid: {
                                  display: false,
                                }
                              },
                            },
                          }}
                        />
                      )}

                      {selectedTimeframe === "month" && (
                        <Line
                          data={{
                            labels: Array.from({ length: new Date().getDate() }, (_, i) => i + 1),
                            datasets: [
                              {
                                label: "Completion",
                                data: Array.from({ length: new Date().getDate() }, (_, i) =>
                                  Math.random() > 0.3 ? 1 : 0
                                ),
                                backgroundColor: "rgba(139, 92, 246, 0.5)",
                                borderColor: "rgba(139, 92, 246, 1)",
                                tension: 0.2,
                                fill: true,
                              }
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  font: {
                                    size: 10,
                                  }
                                }
                              },
                              tooltip: {
                                titleFont: {
                                  size: 10,
                                },
                                bodyFont: {
                                  size: 10,
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 1,
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  stepSize: 1,
                                  font: {
                                    size: 9,
                                  },
                                  callback: function (value) {
                                    return value === 0 ? "Missed" : "Done";
                                  }
                                }
                              },
                              x: {
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  maxRotation: 0,
                                  autoSkip: true,
                                  maxTicksLimit: 6,
                                  font: {
                                    size: 9,
                                  }
                                }
                              }
                            }
                          }}
                        />
                      )}

                      {selectedTimeframe === "year" && (
                        <Line
                          data={{
                            labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
                            datasets: [
                              {
                                label: "Completion Rate (%)",
                                data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 40),
                                backgroundColor: "rgba(236, 72, 153, 0.3)",
                                borderColor: "rgba(236, 72, 153, 1)",
                                tension: 0.3,
                                fill: true,
                              }
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  font: {
                                    size: 10,
                                  }
                                }
                              },
                              tooltip: {
                                titleFont: {
                                  size: 10,
                                },
                                bodyFont: {
                                  size: 10,
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  callback: function (value) {
                                    return value + "%";
                                  },
                                  font: {
                                    size: 9,
                                  }
                                }
                              },
                              x: {
                                ticks: {
                                  color: "rgba(255, 255, 255, 0.7)",
                                  font: {
                                    size: 9,
                                  }
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}