import React, { useState, useEffect } from 'react';
import './App.css';

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

  // Calculate available seats
  const leftAvailableSeats = totalSeatsPerSide - leftSidePosition.filledCount;
  const rightAvailableSeats = totalSeatsPerSide - rightSidePosition.filledCount;
  const totalFilledSeats = leftSidePosition.filledCount + rightSidePosition.filledCount;
  const totalStudents = courses.reduce((sum, course) => sum + course.regCount, 0);

  return (
    <div className="App">
      <div className="header print-hide">
        <h1>NEHRU ARTS AND SCIENCE COLLEGE (AUTONOMOUS)</h1>
        <p className="subtitle">
          (Affiliated to Bharathiar University Accredited with "A+" Grade by NAAC,<br />
          ISO 9001:2015 (QMS) & 21001:2018 (EDMS) Certified, Recognized by UGC with 2(f) &12(B),<br />
          Under Star College Science by DBT. Approved by AICTE, Govt. of India).<br />
          Nehru Gardens, Thirumalayampalayam, Coimbatore – 641 105, Tamil Nadu, India.<br />
          E-mail: nascoffice@nehrucolleges.com. Ph: 0422-2480007 Web Site: www.nasccbe.ac.in
        </p>
      </div>

      <hr className="divider print-hide" />

      <div className="exam-info">
        <h2 className="center-title">NASC - HALL SEATING ARRANGEMENT By Neethika</h2>

        <div className="exam-details-input print-hide">
          <div className="exam-input-group">
            <label>DATE OF EXAMINATION:</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="exam-input"
            />
          </div>

          <div className="exam-input-group">
            <label>SESSION:</label>
            <div className="session-radio-group">
              <label className="session-option">
                <input
                  type="radio"
                  value="AM"
                  checked={session === 'AM'}
                  onChange={() => setSession('AM')}
                />
                <span>AM</span>
              </label>
              <label className="session-option">
                <input
                  type="radio"
                  value="PM"
                  checked={session === 'PM'}
                  onChange={() => setSession('PM')}
                />
                <span>PM</span>
              </label>
            </div>
          </div>

          <div className="exam-input-group">
            <label>EXAM HALL:</label>
            <input
              type="text"
              value={examHall}
              onChange={(e) => setExamHall(e.target.value)}
              placeholder="e.g., Hall 1"
              className="exam-input"
            />
          </div>

          {/* Seating Configuration */}
          <div className="exam-input-group">
            <label>SEATING CONFIGURATION:</label>
            <div className="seating-config-group">
              <div className="config-input">
                <label>Rows:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value) || 7)}
                  className="config-number"
                />
              </div>
              <div className="config-input">
                <label>Columns:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 4)}
                  className="config-number"
                />
              </div>
              <div className="config-summary">
                <span>Total Seats: {totalSeats} ({totalSeatsPerSide} per side)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print-only header */}
        <div className="print-header">
          <div className="print-college-name underline">NEHRU ARTS AND SCIENCE COLLEGE</div>
          <div className="print-exam-details">
            <div className="print-detail-column">
              <span><strong>Date:</strong> {examDate || '_______________'}</span>
              <span><strong>Session:</strong> {session},    </span>
              <span><strong>Hall:</strong> {examHall || '_______________'}</span>
            </div>
            <div className="print-detail-column">
             
              <span><strong>Total Seats:</strong> {totalSeats}</span>
            </div>
          </div>
          <div className="print-title">HALL SEATING ARRANGEMENT</div>
        </div>
      </div>

      <div className="controls-container print-hide">
        <div className="current-course-form">
          <h3>Add Course Students</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Department:</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                placeholder="e.g., DS"
                className="department-input"
              />
            </div>

            <div className="form-group">
              <label>Course Code:</label>
              <input
                type="text"
                value={currentCourseCode}
                onChange={(e) => setCurrentCourseCode(e.target.value)}
                placeholder="Enter course code"
              />
            </div>

            <div className="form-group">
              <label>Course Title:</label>
              <input
                type="text"
                value={currentCourseTitle}
                onChange={(e) => setCurrentCourseTitle(e.target.value)}
                placeholder="Enter course title"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Starting Register Number:</label>
              <input
                type="text"
                value={startRegNo}
                onChange={(e) => setStartRegNo(e.target.value.toUpperCase())}
                placeholder="e.g., 24PGDT001"
              />
            </div>

            <div className="form-group">
              <label>Ending Register Number:</label>
              <input
                type="text"
                value={endRegNo}
                onChange={(e) => setEndRegNo(e.target.value.toUpperCase())}
                placeholder="e.g., 24PGDT012"
              />
            </div>

            <div className="form-group">
              <label>Total Students:</label>
              <div className="count-display">
                <span className="count-value">{regCount > 0 ? regCount : '0'}</span>
                <span className="count-label"> students</span>
              </div>
              <div className="seat-availability">
                <div className="availability-row">
                  <span>Total Available:</span>
                  <span className="availability-value">{totalSeats - totalFilledSeats} / {totalSeats}</span>
                </div>
                <div className="availability-row">
                  <span>Left Side Available:</span>
                  <span className="availability-value">{leftAvailableSeats} / {totalSeatsPerSide}</span>
                </div>
                <div className="availability-row">
                  <span>Right Side Available:</span>
                  <span className="availability-value">{rightAvailableSeats} / {totalSeatsPerSide}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fill Which Side First:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="left"
                    checked={fillSide === 'left'}
                    onChange={() => setFillSide('left')}
                  />
                  <span className="radio-label">Left Side First</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="right"
                    checked={fillSide === 'right'}
                    onChange={() => setFillSide('right')}
                  />
                  <span className="radio-label">Right Side First</span>
                </label>
              </div>
            </div>

            <div className="form-group button-group">
              <button type="button" className="btn save-btn" onClick={saveAndAddCourse}>
                Save Course & Add to Seating
              </button>
              <button type="button" className="btn clear-btn" onClick={clearAllCourses}>
                Clear All Courses
              </button>
              <button type="button" className="btn print-btn" onClick={handlePrint}>
                Print/PDF
              </button>
            </div>
          </div>

          <div className="edit-instructions">
            <p><strong>Feature:</strong> Click on any seat to edit the register number directly.</p>
          </div>
        </div>

        {courses.length > 0 && (
          <div className="courses-list print-hide">
            <h3>Added Courses ({courses.length})</h3>
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Register Numbers</th>
                  <th>Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.department}</td>
                    <td>{course.courseCode}</td>
                    <td>{course.courseTitle}</td>
                    <td>
                      {course.startRegNo} to {course.endRegNo}
                    </td>
                    <td>{course.regCount}</td>
                    <td>
                      <button
                        type="button"
                        className="btn remove-btn"
                        onClick={() => removeCourse(course.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="total-label">
                    <strong>Total Students:</strong>
                  </td>
                  <td className="total-count">
                    <strong>{totalStudents}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="seating-container">
        <div className="seating-arrangement">
          <table className="seating-table">
            <thead>
              <tr>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <th key={colIndex}>
                    Column {colIndex + 1}<br />
                    <small>{colIndex % 2 === 0 ? 'Top to Bottom' : 'Bottom to Top'}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seatingData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((col, colIndex) => {
                    return (
                      <td key={colIndex} className="column-cell">
                        <div className="seat-sides">
                          {/* Left Side */}
                          <div className="seat-side left-side">
                            {editingCell && editingCell.row === rowIndex &&
                              editingCell.col === colIndex && editingCell.side === 'left' ? (
                              <div className="edit-input-container">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="edit-input"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                />
                                <div className="edit-buttons">
                                  <button className="edit-save-btn" onClick={saveEdit}>✓</button>
                                  <button className="edit-cancel-btn" onClick={cancelEdit}>✗</button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`reg-number print-remove-l clickable ${col.leftSequenceId ? 'sequence-seat' : ''}`}
                                onClick={() => handleCellClick(rowIndex, colIndex, 'left', col.left)}
                                title={col.leftSequenceId ? "Part of auto-renumbering sequence" : ""}
                              >
                                {col.left || ' '}
                              </div>
                            )}
                          </div>

                          {/* Right Side */}
                          <div className="seat-side right-side">
                            {editingCell && editingCell.row === rowIndex &&
                              editingCell.col === colIndex && editingCell.side === 'right' ? (
                              <div className="edit-input-container">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="edit-input"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                />
                                <div className="edit-buttons">
                                  <button className="edit-save-btn" onClick={saveEdit}>✓</button>
                                  <button className="edit-cancel-btn" onClick={cancelEdit}>✗</button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`reg-number print-remove-r clickable ${col.rightSequenceId ? 'sequence-seat' : ''}`}
                                onClick={() => handleCellClick(rowIndex, colIndex, 'right', col.right)}
                                title={col.rightSequenceId ? "Part of auto-renumbering sequence" : ""}
                              >
                                {col.right || ' '}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="legend print-hide">
          <div className="legend-item">
            <span className="legend-color left-color"></span>
            <span>Left Side: {leftSidePosition.filledCount}/{totalSeatsPerSide} filled</span>
          </div>
          <div className="legend-item">
            <span className="legend-color right-color"></span>
            <span>Right Side: {rightSidePosition.filledCount}/{totalSeatsPerSide} filled</span>
          </div>
          <div className="legend-item">
            <span className="legend-color total-color"></span>
            <span>Total: {totalFilledSeats}/{totalSeats} seats filled</span>
          </div>
          <div className="legend-item">
            <span className="legend-color sequence-color"></span>
            <span>Auto-renumbering seats</span>
          </div>
        </div>
      </div>

      <div className="footer-section">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Total Students</th>
              <th>PRESENT</th>
              <th>ABSENT</th>
            </tr>
          </thead>
          <tbody>
            {courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.department}</td>
                  <td>{course.courseCode}</td>
                  <td>{course.courseTitle}</td>
                  <td>{course.regCount}</td>
                  <td>_______________</td>
                  <td>_______________</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>{department || '_______________'}</td>
                <td>_______________</td>
                <td>_______________</td>
                <td>_______________</td>
                <td>_______________</td>
                <td>_______________</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="footer-total-label">
                <strong>TOTAL STUDENTS:</strong>
              </td>
              <td className="footer-total-count">
                <strong>{totalStudents}</strong>
              </td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>

        <div className="signature-section">
          <div className="signature-line"></div>
          <p>Name and Signature of the Hall Superintendent</p>
        </div>
      </div>
    </div>
  );
}

export default App;