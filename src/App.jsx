import React, { useState, useEffect } from 'react';

function App() {
  // State for exam details
  const [examDate, setExamDate] = useState('');
  const [examHall, setExamHall] = useState('');
  const [session, setSession] = useState('AM'); // AM or PM

  // State for seating configuration
  const [rows, setRows] = useState(7);
  const [columns, setColumns] = useState(4);

  // State for current course details
  const [department, setDepartment] = useState('');
  const [currentCourseCode, setCurrentCourseCode] = useState('');
  const [currentCourseTitle, setCurrentCourseTitle] = useState('');

  // State for register numbers
  const [startRegNo, setStartRegNo] = useState('');
  const [endRegNo, setEndRegNo] = useState('');
  const [regCount, setRegCount] = useState(0);

  // State for arrangement direction
  const [fillSide, setFillSide] = useState('left'); // 'left' or 'right'

  // Initialize seating data based on rows and columns
  const initializeSeatingData = () => {
    return Array(parseInt(rows)).fill().map(() =>
      Array(parseInt(columns)).fill().map(() => ({
        left: null,
        right: null,
        leftCourseId: null,
        rightCourseId: null,
        leftSequenceId: null,
        rightSequenceId: null,
        leftSequenceIndex: null,
        rightSequenceIndex: null
      }))
    );
  };

  // State for the seating data
  const [seatingData, setSeatingData] = useState(initializeSeatingData());

  // State for saved courses
  const [courses, setCourses] = useState([]);

  // Calculate total seats per side
  const totalSeatsPerSide = rows * columns;
  const totalSeats = totalSeatsPerSide * 2;

  // State to track current position for each side
  const [leftSidePosition, setLeftSidePosition] = useState({
    col: 0,
    row: 0,
    filledCount: 0
  });

  const [rightSidePosition, setRightSidePosition] = useState({
    col: 0,
    row: 0,
    filledCount: 0
  });

  // State for editing
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // State to track sequences
  const [sequenceCounter, setSequenceCounter] = useState(1);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Reinitialize seating data when rows or columns change
  useEffect(() => {
    const newSeatingData = initializeSeatingData();
    setSeatingData(newSeatingData);
    
    // Reset positions
    setLeftSidePosition({
      col: 0,
      row: 0,
      filledCount: 0
    });
    
    setRightSidePosition({
      col: 0,
      row: 0,
      filledCount: 0
    });
    
    // Clear courses if grid changes
    if (courses.length > 0) {
      if (window.confirm('Changing grid size will clear all courses. Do you want to continue?')) {
        setCourses([]);
        setSequenceCounter(1);
      } else {
        // Revert rows/columns to previous values
        setRows(prev => {
          const prevRows = parseInt(rows);
          return isNaN(prevRows) ? 7 : prevRows;
        });
        setColumns(prev => {
          const prevCols = parseInt(columns);
          return isNaN(prevCols) ? 4 : prevCols;
        });
      }
    }
  }, [rows, columns]);

  // Calculate count when register numbers change
  useEffect(() => {
    calculateRegCount();
  }, [startRegNo, endRegNo]);

  const calculateRegCount = () => {
    try {
      // If either start or end is empty, set count to 0
      if (!startRegNo || !endRegNo) {
        setRegCount(0);
        return;
      }

      const getPrefix = (str) => {
        const match = str.match(/^(.*?)(\d+)$/);
        if (!match) return { prefix: str, number: 0 };
        return { prefix: match[1], number: parseInt(match[2]) };
      };

      const startInfo = getPrefix(startRegNo);
      const endInfo = getPrefix(endRegNo);

      if (startInfo.prefix !== endInfo.prefix) {
        setRegCount(0);
        return;
      }

      const count = endInfo.number - startInfo.number + 1;
      setRegCount(count > 0 ? count : 0);
    } catch (error) {
      setRegCount(0);
    }
  };

  // Extract number from register number
  const extractNumber = (regNo) => {
    if (!regNo) return null;
    const match = regNo.match(/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  };

  // Extract prefix from register number
  const extractPrefix = (regNo) => {
    if (!regNo) return null;
    const match = regNo.match(/^(.*?)(\d+)$/);
    return match ? match[1] : null;
  };

  // Generate register numbers list
  const generateRegisterNumbers = () => {
    try {
      const getPrefix = (str) => {
        const match = str.match(/^(.*?)(\d+)$/);
        if (!match) return { prefix: str, number: 0 };
        return { prefix: match[1], number: parseInt(match[2]) };
      };

      const startInfo = getPrefix(startRegNo);
      const endInfo = getPrefix(endRegNo);

      if (startInfo.prefix !== endInfo.prefix) {
        return [];
      }

      const numbers = [];
      const maxDigits = startRegNo.match(/\d+/)[0].length;

      for (let i = startInfo.number; i <= endInfo.number; i++) {
        const numStr = i.toString().padStart(maxDigits, '0');
        numbers.push(`${startInfo.prefix}${numStr}`);
      }

      return numbers;
    } catch (error) {
      return [];
    }
  };

  // Fill seats with register numbers based on selected side
  const fillSeatsWithRegisterNumbers = (regNumbers, courseId) => {
    if (regNumbers.length === 0) return {
      arrangement: seatingData,
      newLeftPosition: leftSidePosition,
      newRightPosition: rightSidePosition
    };

    const numRows = parseInt(rows);
    const numCols = parseInt(columns);
    const sequenceId = sequenceCounter;

    // Create a deep copy of current arrangement
    const newArrangement = JSON.parse(JSON.stringify(seatingData));
    let regIndex = 0;
    let currentLeftPos = { ...leftSidePosition };
    let currentRightPos = { ...rightSidePosition };

    if (fillSide === 'left') {
      // Fill left side seats ONLY
      while (regIndex < regNumbers.length && currentLeftPos.filledCount < totalSeatsPerSide) {
        // Determine current row based on column direction
        let currentRow;
        if (currentLeftPos.col % 2 === 0) {
          // Even columns (0, 2): top to bottom
          currentRow = currentLeftPos.row;
        } else {
          // Odd columns (1, 3): bottom to top
          currentRow = numRows - 1 - currentLeftPos.row;
        }

        // Fill the seat
        if (!newArrangement[currentRow][currentLeftPos.col].left) {
          newArrangement[currentRow][currentLeftPos.col].left = regNumbers[regIndex];
          newArrangement[currentRow][currentLeftPos.col].leftCourseId = courseId;
          newArrangement[currentRow][currentLeftPos.col].leftSequenceId = sequenceId;
          newArrangement[currentRow][currentLeftPos.col].leftSequenceIndex = regIndex;
          regIndex++;
          currentLeftPos.filledCount++;
        }

        // Move to next seat
        currentLeftPos.row++;

        // Check if we need to move to next column
        if (currentLeftPos.row >= numRows) {
          currentLeftPos.row = 0;
          currentLeftPos.col++;

          // If all columns filled, break
          if (currentLeftPos.col >= numCols) break;
        }
      }

      // Do NOT fill right side if left side is full - this is prevented by validation
    } else {
      // Fill right side seats ONLY
      while (regIndex < regNumbers.length && currentRightPos.filledCount < totalSeatsPerSide) {
        // Determine current row based on direction
        let currentRow;
        if (currentRightPos.col % 2 === 0) {
          // Even columns (0, 2): top to bottom
          currentRow = currentRightPos.row;
        } else {
          // Odd columns (1, 3): bottom to top
          currentRow = numRows - 1 - currentRightPos.row;
        }

        // Fill the seat
        if (!newArrangement[currentRow][currentRightPos.col].right) {
          newArrangement[currentRow][currentRightPos.col].right = regNumbers[regIndex];
          newArrangement[currentRow][currentRightPos.col].rightCourseId = courseId;
          newArrangement[currentRow][currentRightPos.col].rightSequenceId = sequenceId;
          newArrangement[currentRow][currentRightPos.col].rightSequenceIndex = regIndex;
          regIndex++;
          currentRightPos.filledCount++;
        }

        // Move to next seat
        currentRightPos.row++;

        // Check if we need to move to next column
        if (currentRightPos.row >= numRows) {
          currentRightPos.row = 0;
          currentRightPos.col++;

          // If all columns filled, break
          if (currentRightPos.col >= numCols) break;
        }
      }

      // Do NOT fill left side if right side is full - this is prevented by validation
    }

    setSequenceCounter(prev => prev + 1);

    return {
      arrangement: newArrangement,
      newLeftPosition: currentLeftPos,
      newRightPosition: currentRightPos
    };
  };

  // Save current course and add to seating arrangement
  const saveAndAddCourse = () => {
    if (!department || !currentCourseCode || !currentCourseTitle) {
      alert('Please enter department, course code, and course title');
      return;
    }

    const regNumbers = generateRegisterNumbers();
    if (regNumbers.length === 0) {
      alert('Please enter valid register numbers');
      return;
    }

    // Calculate available seats
    const leftAvailableSeats = totalSeatsPerSide - leftSidePosition.filledCount;
    const rightAvailableSeats = totalSeatsPerSide - rightSidePosition.filledCount;

    // Check if there are enough seats available only on the selected side
    if (fillSide === 'left') {
      // For left side first: only check left side availability
      if (regNumbers.length > leftAvailableSeats) {
        alert(`Only ${leftAvailableSeats} seats available on Left Side. Please adjust register numbers or change filling side.`);
        return;
      }
    } else {
      // For right side first: only check right side availability
      if (regNumbers.length > rightAvailableSeats) {
        alert(`Only ${rightAvailableSeats} seats available on Right Side. Please adjust register numbers or change filling side.`);
        return;
      }
    }

    const courseId = Date.now();

    // Fill seats with register numbers
    const result = fillSeatsWithRegisterNumbers(regNumbers, courseId);

    // Add course to courses list
    const newCourse = {
      id: courseId,
      department: department,
      courseCode: currentCourseCode,
      courseTitle: currentCourseTitle,
      startRegNo: startRegNo,
      endRegNo: endRegNo,
      regCount: regNumbers.length,
      regNumbers: regNumbers,
      sequenceId: sequenceCounter,
      fillSide: fillSide
    };

    setCourses([...courses, newCourse]);
    setSeatingData(result.arrangement);
    setLeftSidePosition(result.newLeftPosition);
    setRightSidePosition(result.newRightPosition);

    // Reset current course form (keep department)
    setStartRegNo('');
    setEndRegNo('');
    setRegCount(0);
    setDepartment('');
    setCurrentCourseCode('');
    setCurrentCourseTitle('');

    alert(`Added ${regNumbers.length} students for ${department} - ${currentCourseCode}`);
  };

  // Remove a course and its register numbers
  const removeCourse = (courseId) => {
    const courseToRemove = courses.find(c => c.id === courseId);
    if (!courseToRemove) return;

    // Ask for confirmation
    if (!window.confirm(`Are you sure you want to remove ${courseToRemove.department} - ${courseToRemove.courseCode} with ${courseToRemove.regCount} students?`)) {
      return;
    }

    // Remove the course
    const updatedCourses = courses.filter(c => c.id !== courseId);
    setCourses(updatedCourses);

    // Remove course seats from arrangement
    removeCourseSeats(courseId, courseToRemove.fillSide);
  };

  // Remove specific course seats from arrangement
  const removeCourseSeats = (courseId, fillSide) => {
    const newArrangement = JSON.parse(JSON.stringify(seatingData));
    let leftFilledCount = 0;
    let rightFilledCount = 0;
    const numRows = parseInt(rows);
    const numCols = parseInt(columns);

    // Clear all seats with this course ID
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (fillSide === 'left') {
          if (newArrangement[row][col].leftCourseId === courseId) {
            newArrangement[row][col].left = null;
            newArrangement[row][col].leftCourseId = null;
            newArrangement[row][col].leftSequenceId = null;
            newArrangement[row][col].leftSequenceIndex = null;
          }
        } else {
          if (newArrangement[row][col].rightCourseId === courseId) {
            newArrangement[row][col].right = null;
            newArrangement[row][col].rightCourseId = null;
            newArrangement[row][col].rightSequenceId = null;
            newArrangement[row][col].rightSequenceIndex = null;
          }
        }
      }
    }

    // Recalculate filled counts
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (newArrangement[row][col].left) leftFilledCount++;
        if (newArrangement[row][col].right) rightFilledCount++;
      }
    }

    setSeatingData(newArrangement);

    // Update filledCount with the new counts
    setLeftSidePosition(prev => ({
      ...prev,
      filledCount: leftFilledCount
    }));

    setRightSidePosition(prev => ({
      ...prev,
      filledCount: rightFilledCount
    }));

    // Rebuild positions
    rebuildSeatingPositions(newArrangement);
  };

  // Rebuild seating positions after removal
  const rebuildSeatingPositions = (arrangement) => {
    const numRows = parseInt(rows);
    const numCols = parseInt(columns);

    // Find last filled position for left side
    let allLeftEmpty = true;
    let allRightEmpty = true;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (arrangement[row][col].left) {
          allLeftEmpty = false;
          break;
        }
      }
      if (!allLeftEmpty) break;
    }

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (arrangement[row][col].right) {
          allRightEmpty = false;
          break;
        }
      }
      if (!allRightEmpty) break;
    }

    if (allLeftEmpty) {
      setLeftSidePosition({
        col: 0,
        row: 0,
        filledCount: 0
      });
    } else {
      // Find next empty position for left side
      let lastLeftCol = 0;
      let lastLeftRow = 0;
      let leftFound = false;

      for (let col = 0; col < numCols; col++) {
        const direction = col % 2 === 0 ? 'down' : 'up';

        if (direction === 'down') {
          for (let row = 0; row < numRows; row++) {
            if (!arrangement[row][col].left) {
              lastLeftCol = col;
              lastLeftRow = row;
              leftFound = true;
              break;
            }
          }
        } else {
          for (let row = numRows - 1; row >= 0; row--) {
            if (!arrangement[row][col].left) {
              lastLeftCol = col;
              lastLeftRow = direction === 'up' ? numRows - 1 - row : row;
              leftFound = true;
              break;
            }
          }
        }
        if (leftFound) break;
      }

      setLeftSidePosition(prev => ({
        ...prev,
        col: lastLeftCol,
        row: lastLeftRow
      }));
    }

    if (allRightEmpty) {
      setRightSidePosition({
        col: 0,
        row: 0,
        filledCount: 0
      });
    } else {
      // Find next empty position for right side
      let lastRightCol = 0;
      let lastRightRow = 0;
      let rightFound = false;

      for (let col = 0; col < numCols; col++) {
        const direction = col % 2 === 0 ? 'down' : 'up';

        if (direction === 'down') {
          for (let row = 0; row < numRows; row++) {
            if (!arrangement[row][col].right) {
              lastRightCol = col;
              lastRightRow = row;
              rightFound = true;
              break;
            }
          }
        } else {
          for (let row = numRows - 1; row >= 0; row--) {
            if (!arrangement[row][col].right) {
              lastRightCol = col;
              lastRightRow = direction === 'up' ? numRows - 1 - row : row;
              rightFound = true;
              break;
            }
          }
        }
        if (rightFound) break;
      }

      setRightSidePosition(prev => ({
        ...prev,
        col: lastRightCol,
        row: lastRightRow
      }));
    }
  };

  // Clear all courses
  const clearAllCourses = () => {
    if (window.confirm('Are you sure you want to clear all courses?')) {
      setCourses([]);
      setSeatingData(initializeSeatingData());
      setLeftSidePosition({
        col: 0,
        row: 0,
        filledCount: 0
      });
      setRightSidePosition({
        col: 0,
        row: 0,
        filledCount: 0
      });
      setSequenceCounter(1);
    }
  };

  // Handle cell click for editing
  const handleCellClick = (rowIndex, colIndex, side, value) => {
    setEditingCell({ row: rowIndex, col: colIndex, side });
    setEditValue(value || '');
  };

  // Find all cells in the same sequence
  const findSequenceCells = (row, col, side, sequenceId) => {
    const numRows = parseInt(rows);
    const numCols = parseInt(columns);
    const cells = [];
    
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (side === 'left' && seatingData[r][c].leftSequenceId === sequenceId) {
          cells.push({
            row: r,
            col: c,
            side: 'left',
            value: seatingData[r][c].left,
            sequenceIndex: seatingData[r][c].leftSequenceIndex
          });
        }
        if (side === 'right' && seatingData[r][c].rightSequenceId === sequenceId) {
          cells.push({
            row: r,
            col: c,
            side: 'right',
            value: seatingData[r][c].right,
            sequenceIndex: seatingData[r][c].rightSequenceIndex
          });
        }
      }
    }

    // Sort by sequence index
    cells.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    return cells;
  };

  // Save edited value with auto-renumbering
  const saveEdit = () => {
    if (!editingCell) return;

    const { row, col, side } = editingCell;
    const currentSeat = seatingData[row][col];
    const sequenceId = side === 'left' ? currentSeat.leftSequenceId : currentSeat.rightSequenceId;
    const sequenceIndex = side === 'left' ? currentSeat.leftSequenceIndex : currentSeat.rightSequenceIndex;

    if (editValue.trim() === '') {
      // Clear the seat
      const newArrangement = JSON.parse(JSON.stringify(seatingData));

      if (side === 'left') {
        newArrangement[row][col].left = null;
        newArrangement[row][col].leftCourseId = null;
        newArrangement[row][col].leftSequenceId = null;
        newArrangement[row][col].leftSequenceIndex = null;
        setLeftSidePosition(prev => ({
          ...prev,
          filledCount: Math.max(0, prev.filledCount - 1)
        }));
      } else {
        newArrangement[row][col].right = null;
        newArrangement[row][col].rightCourseId = null;
        newArrangement[row][col].rightSequenceId = null;
        newArrangement[row][col].rightSequenceIndex = null;
        setRightSidePosition(prev => ({
          ...prev,
          filledCount: Math.max(0, prev.filledCount - 1)
        }));
      }

      setSeatingData(newArrangement);
    } else {
      // Parse the new value
      const newPrefix = extractPrefix(editValue);
      const newNumber = extractNumber(editValue);

      if (!newPrefix || newNumber === null) {
        alert('Invalid register number format');
        return;
      }

      // If this seat is part of a sequence, renumber the entire sequence
      if (sequenceId !== null && sequenceIndex !== null) {
        const sequenceCells = findSequenceCells(row, col, side, sequenceId);

        if (sequenceCells.length > 0) {
          // Find the edited cell in the sequence
          const editedCellIndex = sequenceCells.findIndex(
            cell => cell.row === row && cell.col === col && cell.side === side
          );

          if (editedCellIndex !== -1) {
            const newArrangement = JSON.parse(JSON.stringify(seatingData));
            const match = editValue.match(/\d+/);
            const maxDigits = match ? match[0].length : 3;

            // Renumber all cells in the sequence starting from the edited position
            for (let i = editedCellIndex; i < sequenceCells.length; i++) {
              const cell = sequenceCells[i];
              const newNum = newNumber + (i - editedCellIndex);
              const newNumStr = newNum.toString().padStart(maxDigits, '0');
              const newRegNo = `${newPrefix}${newNumStr}`;

              if (cell.side === 'left') {
                newArrangement[cell.row][cell.col].left = newRegNo;
              } else {
                newArrangement[cell.row][cell.col].right = newRegNo;
              }
            }

            setSeatingData(newArrangement);
          }
        } else {
          // Single seat edit
          const newArrangement = JSON.parse(JSON.stringify(seatingData));

          if (side === 'left') {
            newArrangement[row][col].left = editValue.toUpperCase();
            if (!currentSeat.left) {
              setLeftSidePosition(prev => ({ ...prev, filledCount: prev.filledCount + 1 }));
            }
          } else {
            newArrangement[row][col].right = editValue.toUpperCase();
            if (!currentSeat.right) {
              setRightSidePosition(prev => ({ ...prev, filledCount: prev.filledCount + 1 }));
            }
          }

          // Clear sequence info for manually edited seats
          if (side === 'left') {
            newArrangement[row][col].leftSequenceId = null;
            newArrangement[row][col].leftSequenceIndex = null;
          } else {
            newArrangement[row][col].rightSequenceId = null;
            newArrangement[row][col].rightSequenceIndex = null;
          }

          setSeatingData(newArrangement);
        }
      } else {
        // Single seat edit (not part of a sequence)
        const newArrangement = JSON.parse(JSON.stringify(seatingData));

        if (side === 'left') {
          newArrangement[row][col].left = editValue.toUpperCase();
          if (!currentSeat.left) {
            setLeftSidePosition(prev => ({ ...prev, filledCount: prev.filledCount + 1 }));
          }
        } else {
          newArrangement[row][col].right = editValue.toUpperCase();
          if (!currentSeat.right) {
            setRightSidePosition(prev => ({ ...prev, filledCount: prev.filledCount + 1 }));
          }
        }

        setSeatingData(newArrangement);
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Generate PDF for printing
  const handlePrint = () => {
    window.print();
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Calculate available seats
  const leftAvailableSeats = totalSeatsPerSide - leftSidePosition.filledCount;
  const rightAvailableSeats = totalSeatsPerSide - rightSidePosition.filledCount;
  const totalFilledSeats = leftSidePosition.filledCount + rightSidePosition.filledCount;
  const totalStudents = courses.reduce((sum, course) => sum + course.regCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-2 md:p-6">
      {/* Mobile Header */}
      <div className="print:hidden lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 shadow-xl flex items-center justify-between">
        <button 
          onClick={toggleMobileMenu}
          className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl hover:bg-white/30 transition-all duration-300"
        >
          ☰
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Hall Seating</h1>
          <p className="text-sm opacity-90">
            {rows}×{columns} Grid • {totalFilledSeats}/{totalSeats} Filled
          </p>
        </div>
        <button 
          onClick={handlePrint}
          className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl hover:bg-white/30 transition-all duration-300"
        >
          🖨️
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="print:hidden lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Navigation</h3>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full p-4 text-left rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 flex items-center gap-4">
                <span className="text-2xl">🪑</span>
                <span className="font-medium text-gray-800">Seating Arrangement</span>
              </button>
              <button className="w-full p-4 text-left rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">📚</span>
                  <span className="font-medium text-gray-800">Courses</span>
                </div>
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {courses.length}
                </span>
              </button>
              <button className="w-full p-4 text-left rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 flex items-center gap-4">
                <span className="text-2xl">📊</span>
                <span className="font-medium text-gray-800">Summary</span>
              </button>
              <button className="w-full p-4 text-left rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 hover:from-amber-100 hover:to-yellow-100 transition-all duration-300 flex items-center gap-4">
                <span className="text-2xl">➕</span>
                <span className="font-medium text-gray-800">Add Course</span>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <span className="text-gray-600 font-medium">Total Students:</span>
                  <span className="text-2xl font-bold text-gray-800">{totalStudents}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <span className="text-gray-600 font-medium">Available Seats:</span>
                  <span className="text-2xl font-bold text-gray-800">{totalSeats - totalFilledSeats}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden mt-16 lg:mt-0 ${showMobileMenu ? 'blur-sm' : ''}`}>
        {/* Desktop Header */}
        <div className="print:hidden hidden lg:block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8">
          <h1 className="text-4xl font-bold text-center mb-4 drop-shadow-lg">NEHRU ARTS AND SCIENCE COLLEGE (AUTONOMOUS)</h1>
          <p className="text-center text-lg opacity-90 leading-relaxed">
            (Affiliated to Bharathiar University Accredited with "A+" Grade by NAAC,<br />
            ISO 9001:2015 (QMS) & 21001:2018 (EDMS) Certified, Recognized by UGC with 2(f) &12(B),<br />
            Under Star College Science by DBT. Approved by AICTE, Govt. of India).<br />
            Nehru Gardens, Thirumalayampalayam, Coimbatore – 641 105, Tamil Nadu, India.<br />
            E-mail: nascoffice@nehrucolleges.com. Ph: 0422-2480007 Web Site: www.nasccbe.ac.in
          </p>
        </div>

        {/* Gradient Divider */}
        <div className="print:hidden h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Exam Info Section */}
        <div className="p-6 md:p-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 relative">
            HALL SEATING ARRANGEMENT
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </h2>

          {/* Exam Details Form */}
          <div className="print:hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">DATE OF EXAMINATION</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all duration-300"
                />
              </div>

              {/* Session */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">SESSION</label>
                <div className="flex space-x-4 pt-1">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        value="AM"
                        checked={session === 'AM'}
                        onChange={() => setSession('AM')}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 ${session === 'AM' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'} flex items-center justify-center transition-all duration-300 group-hover:border-indigo-400`}>
                        {session === 'AM' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-indigo-600 transition-colors duration-300">AM</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        value="PM"
                        checked={session === 'PM'}
                        onChange={() => setSession('PM')}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 ${session === 'PM' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'} flex items-center justify-center transition-all duration-300 group-hover:border-indigo-400`}>
                        {session === 'PM' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-indigo-600 transition-colors duration-300">PM</span>
                  </label>
                </div>
              </div>

              {/* Hall */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">EXAM HALL</label>
                <input
                  type="text"
                  value={examHall}
                  onChange={(e) => setExamHall(e.target.value)}
                  placeholder="e.g., Hall 1"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* Seating Configuration */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">SEATING CONFIGURATION</label>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Rows</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value) || 7)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-center font-bold text-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Columns</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={columns}
                        onChange={(e) => setColumns(parseInt(e.target.value) || 4)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-center font-bold text-gray-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-3 rounded-lg">
                      <p className="text-xs text-indigo-600 font-medium">Total Seats</p>
                      <p className="text-2xl font-bold text-indigo-700">{totalSeats}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium">Per Side</p>
                      <p className="text-2xl font-bold text-purple-700">{totalSeatsPerSide}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block text-center mb-8">
            <div className="text-2xl font-bold border-b-2 border-black pb-2 mb-4">NEHRU ARTS AND SCIENCE COLLEGE</div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-center space-x-8">
                <span><strong>Date:</strong> {examDate || '_______________'}</span>
                <span><strong>Session:</strong> {session}</span>
                <span><strong>Hall:</strong> {examHall || '_______________'}</span>
              </div>
              <div className="flex justify-center space-x-8">
                <span><strong>Seating:</strong> {rows} rows × {columns} columns</span>
                <span><strong>Total Seats:</strong> {totalSeats}</span>
              </div>
            </div>
            <div className="text-xl font-bold underline">HALL SEATING ARRANGEMENT</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
          {/* Left Column - Course Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Form Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Add Course Students</h3>
                <div className="flex space-x-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">Available Seats</p>
                    <p className="text-xl font-bold text-emerald-700">{totalSeats - totalFilledSeats}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Total Students</p>
                    <p className="text-xl font-bold text-blue-700">{totalStudents}</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Course Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                      placeholder="e.g., DS"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all duration-300 uppercase placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Course Code</label>
                    <input
                      type="text"
                      value={currentCourseCode}
                      onChange={(e) => setCurrentCourseCode(e.target.value)}
                      placeholder="Enter course code"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all duration-300 placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Course Title</label>
                    <input
                      type="text"
                      value={currentCourseTitle}
                      onChange={(e) => setCurrentCourseTitle(e.target.value)}
                      placeholder="Enter course title"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all duration-300 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Register Numbers */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Register Numbers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Starting Register No.</label>
                    <input
                      type="text"
                      value={startRegNo}
                      onChange={(e) => setStartRegNo(e.target.value.toUpperCase())}
                      placeholder="e.g., 24PGDT001"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all duration-300 uppercase placeholder-gray-400 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ending Register No.</label>
                    <input
                      type="text"
                      value={endRegNo}
                      onChange={(e) => setEndRegNo(e.target.value.toUpperCase())}
                      placeholder="e.g., 24PGDT012"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all duration-300 uppercase placeholder-gray-400 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Students</label>
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 mb-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-bold text-white">{regCount > 0 ? regCount : '0'}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">students</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat Availability */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 text-center">Seat Availability</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border-l-4 border-indigo-500">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-indigo-700">Left Side</span>
                        <span className="text-xl font-bold text-indigo-800">{leftAvailableSeats}/{totalSeatsPerSide}</span>
                      </div>
                      <div className="mt-2 w-full bg-indigo-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(leftAvailableSeats/totalSeatsPerSide)*100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-purple-500">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-700">Right Side</span>
                        <span className="text-xl font-bold text-purple-800">{rightAvailableSeats}/{totalSeatsPerSide}</span>
                      </div>
                      <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(rightAvailableSeats/totalSeatsPerSide)*100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-xl border-l-4 border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-xl font-bold text-gray-800">{totalSeats - totalFilledSeats}/{totalSeats}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-gray-600 to-gray-700 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((totalSeats - totalFilledSeats)/totalSeats)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seating Preferences */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  Seating Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Fill Which Side First</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative cursor-pointer ${fillSide === 'left' ? 'ring-4 ring-indigo-200' : ''}`}>
                        <input
                          type="radio"
                          value="left"
                          checked={fillSide === 'left'}
                          onChange={() => setFillSide('left')}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 ${fillSide === 'left' ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-100' : 'border-gray-300 bg-white hover:border-indigo-300'} transition-all duration-300`}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">⬅️</span>
                            <span className="font-medium text-gray-700">Left Side</span>
                          </div>
                        </div>
                      </label>
                      <label className={`relative cursor-pointer ${fillSide === 'right' ? 'ring-4 ring-purple-200' : ''}`}>
                        <input
                          type="radio"
                          value="right"
                          checked={fillSide === 'right'}
                          onChange={() => setFillSide('right')}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 ${fillSide === 'right' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100' : 'border-gray-300 bg-white hover:border-purple-300'} transition-all duration-300`}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">➡️</span>
                            <span className="font-medium text-gray-700">Right Side</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-4">
                    <button
                      onClick={saveAndAddCourse}
                      className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <span className="text-xl">✓</span>
                      Save Course & Add to Seating
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={clearAllCourses}
                        className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <span>🗑️</span>
                        Clear All
                      </button>
                      <button
                        onClick={handlePrint}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <span>🖨️</span>
                        Print/PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💡</div>
                  <div>
                    <p className="font-bold text-amber-800 mb-1">Tip:</p>
                    <p className="text-amber-700">
                      Click on any seat to edit the register number directly. 
                      Editing a sequence seat will renumber all subsequent seats automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses List */}
            {courses.length > 0 && (
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-200 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-blue-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Added Courses ({courses.length})</h3>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl">
                    <p className="text-lg font-bold">Total Students: {totalStudents}</p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-blue-200">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Dept</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Register Numbers</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Count</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-blue-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800">
                              {course.department}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.courseCode}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{course.courseTitle}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-sm">
                              <div className="text-gray-900 font-bold">{course.startRegNo}</div>
                              <div className="text-gray-500 text-xs text-center">to</div>
                              <div className="text-gray-900 font-bold">{course.endRegNo}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                              {course.regCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => removeCourse(course.id)}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow hover:shadow-lg"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Seating Arrangement */}
          <div className="space-y-8">
            {/* Seating Stats Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Seating Arrangement</h3>
                <div className="flex space-x-3">
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-3 py-2 rounded-lg">
                    <p className="text-xs text-indigo-600 font-medium">Grid</p>
                    <p className="text-lg font-bold text-indigo-700">{rows}×{columns}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-2 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Filled</p>
                    <p className="text-lg font-bold text-purple-700">{totalFilledSeats}/{totalSeats}</p>
                  </div>
                </div>
              </div>

              {/* Seating Table */}
              <div className="overflow-x-auto rounded-xl border-2 border-gray-300">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                      {Array.from({ length: columns }).map((_, colIndex) => (
                        <th key={colIndex} className="px-4 py-3 text-center border-r border-gray-300 last:border-r-0">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-gray-800">Col {colIndex + 1}</span>
                            <span className={`text-xs ${colIndex % 2 === 0 ? 'text-indigo-600' : 'text-purple-600'} font-medium`}>
                              {colIndex % 2 === 0 ? '↓ Top to Bottom' : '↑ Bottom to Top'}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seatingData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((col, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 p-2">
                            <div className="flex h-24">
                              {/* Left Side */}
                              <div className="flex-1 flex items-center justify-center border-r border-gray-300 bg-gradient-to-br from-indigo-50 to-indigo-100">
                                {editingCell && editingCell.row === rowIndex &&
                                  editingCell.col === colIndex && editingCell.side === 'left' ? (
                                  <div className="w-full h-full p-2">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full h-full px-2 text-sm border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center uppercase font-mono"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={saveEdit}
                                        className="flex-1 px-2 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="flex-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300"
                                      >
                                        ✗
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center p-2 cursor-pointer hover:bg-white/50 rounded-lg transition-all duration-300 ${col.leftSequenceId ? 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200' : ''}`}
                                    onClick={() => handleCellClick(rowIndex, colIndex, 'left', col.left)}
                                    title={col.leftSequenceId ? "Part of auto-renumbering sequence" : ""}
                                  >
                                    {col.left ? (
                                      <span className="text-sm font-mono font-bold text-gray-800 text-center break-all">
                                        {col.left}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">Empty</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right Side */}
                              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                                {editingCell && editingCell.row === rowIndex &&
                                  editingCell.col === colIndex && editingCell.side === 'right' ? (
                                  <div className="w-full h-full p-2">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full h-full px-2 text-sm border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-center uppercase font-mono"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={saveEdit}
                                        className="flex-1 px-2 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="flex-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300"
                                      >
                                        ✗
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center p-2 cursor-pointer hover:bg-white/50 rounded-lg transition-all duration-300 ${col.rightSequenceId ? 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200' : ''}`}
                                    onClick={() => handleCellClick(rowIndex, colIndex, 'right', col.right)}
                                    title={col.rightSequenceId ? "Part of auto-renumbering sequence" : ""}
                                  >
                                    {col.right ? (
                                      <span className="text-sm font-mono font-bold text-gray-800 text-center break-all">
                                        {col.right}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">Empty</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-indigo-700">Left Side</p>
                      <p className="text-lg font-bold text-indigo-800">{leftSidePosition.filledCount}/{totalSeatsPerSide}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700">Right Side</p>
                      <p className="text-lg font-bold text-purple-800">{rightSidePosition.filledCount}/{totalSeatsPerSide}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-xl border border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Total</p>
                      <p className="text-lg font-bold text-gray-800">{totalFilledSeats}/{totalSeats}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full border border-amber-600 border-dashed"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-700">Auto-renumbering</p>
                      <p className="text-xs text-amber-600">Click to edit sequence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-emerald-200">
                <h3 className="text-2xl font-bold text-gray-800">Attendance Summary</h3>
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl">
                  <p className="text-lg font-bold">Students: {totalStudents}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-emerald-200">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Dept</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">PRESENT</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">ABSENT</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-emerald-100">
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <tr key={course.id} className="hover:bg-emerald-50 transition-colors duration-200">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-emerald-800">{course.department}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{course.courseCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-xs">{course.courseTitle}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                              {course.regCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">_______________</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">_______________</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No courses added yet. Add a course to see the summary.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {courses.length > 0 && (
                    <tfoot className="bg-gradient-to-r from-emerald-100 to-emerald-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-4 text-right text-sm font-bold text-emerald-800">
                          TOTAL STUDENTS:
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                            {totalStudents}
                          </span>
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Signature Section */}
              <div className="mt-8 pt-6 border-t border-emerald-200">
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
                  <div className="h-0.5 bg-emerald-600 mt-4"></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4 font-medium">
                  Name and Signature of the Hall Superintendent
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .bg-gradient-to-br, .shadow-2xl, .border, .rounded-3xl {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            background: white !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;