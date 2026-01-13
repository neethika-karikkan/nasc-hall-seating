import React, { useState, useEffect } from 'react';

function App() {
  // State for exam details
  const [examDate, setExamDate] = useState('');
  const [examHall, setExamHall] = useState('');
  const [session, setSession] = useState('FN'); // FN or AN

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
    console.log("111111111111111111",regNumbers);
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

  // Calculate available seats
  const leftAvailableSeats = totalSeatsPerSide - leftSidePosition.filledCount;
  const rightAvailableSeats = totalSeatsPerSide - rightSidePosition.filledCount;
  const totalFilledSeats = leftSidePosition.filledCount + rightSidePosition.filledCount;
  const totalStudents = courses.reduce((sum, course) => sum + course.regCount, 0);

  // Handle print with landscape orientation
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hall Seating Arrangement</title>
        <style>
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
          }
          
          .print-container {
            width: 100%;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .college-name {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .title {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 15px;
          }
          
          .exam-details {
            font-size: 11pt;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          
          .exam-details span {
            margin-right: 30px;
          }
          
          .seating-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          
          .seating-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
            font-weight: bold;
          }
          
          .seating-table td {
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            vertical-align: middle;
            height: 35px;
          }
          
          .seat-cell {
            display: flex;
            justify-content: space-between;
            height: 100%;
          }
          
          .left-seat {
            width: 48%;
            text-align: left;
            padding-left: 5px;
            border-right: 1px solid #ddd;
          }
          
          .right-seat {
            width: 48%;
            text-align: left;
            padding-left: 5px;
          }
          
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            font-size: 10pt;
          }
          
          .summary-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-weight: bold;
          }
          
          .summary-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          
          .signature {
            margin-top: 40px;
            text-align: center;
          }
          
          .signature-line {
            width: 300px;
            border-top: 1px solid #000;
            margin: 0 auto 5px;
          }
          
          .footer {
            font-size: 10pt;
            margin-top: 5px;
          }
          
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <div class="college-name">NEHRU ARTS AND SCIENCE COLLEGE (AUTONOMOUS)</div>
            <div class="title">HALL SEATING ARRANGEMENT</div>
            <div class="exam-details">
              <span><strong>Date:</strong> ${examDate || '_______________'}</span>
              <span><strong>Session:</strong> ${session}</span>
              <span><strong>Hall:</strong> ${examHall || '_______________'}</span>
              <span><strong>Seating:</strong> ${rows} rows × ${columns} columns</span>
            </div>
          </div>
          
          <!-- Seating Table -->
          <table class="seating-table">
            <thead>
              <tr>
                ${Array.from({ length: columns }).map((_, colIndex) => `
                  <th>Column ${colIndex + 1}<br/><small>${colIndex % 2 === 0 ? 'Top to Bottom' : 'Bottom to Top'}</small></th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${seatingData.map((row, rowIndex) => `
                <tr>
                  ${row.map((col, colIndex) => `
                    <td>
                      <div class="seat-cell">
                        <div class="left-seat">${col.left || ''}</div>
                        <div class="right-seat">${col.right || ''}</div>
                      </div>
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Summary Table -->
          <table class="summary-table">
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
              ${courses.length > 0 ? courses.map(course => `
                <tr>
                  <td>${course.department}</td>
                  <td>${course.courseCode}</td>
                  <td>${course.courseTitle}</td>
                  <td>${course.regCount}</td>
                  <td>_______________</td>
                  <td>_______________</td>
                </tr>
              `).join('') : `
                <tr>
                  <td>_______________</td>
                  <td>_______________</td>
                  <td>_______________</td>
                  <td>_______________</td>
                  <td>_______________</td>
                  <td>_______________</td>
                </tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL STUDENTS:</td>
                <td style="font-weight: bold;">${totalStudents}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Signature -->
          <div class="signature">
            <div class="signature-line"></div>
            <div class="footer">Name and Signature of the Hall Superintendent</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Hall Seating Arrangement
          </h1>
          <p className="text-lg text-gray-600">Nehru Arts and Science College</p>
        </div>

        {/* Main Dashboard - Vertical flow */}
        <div className="space-y-6">
          {/* Add Course Card - Full width */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="mr-3 text-3xl text-purple-500">🎓</span>
                Add Course Students
              </h2>
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span className="text-xl">🖨️</span>
                <span>Print Layout</span>
              </button>
            </div>

            {/* Exam Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        value="FN"
                        checked={session === 'FN'}
                        onChange={() => setSession('FN')}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${session === 'FN' ? 'border-purple-500 bg-purple-500' : 'border-gray-300 group-hover:border-purple-300'}`}>
                        {session === 'FN' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <span className={`text-gray-700 group-hover:text-purple-600 transition-colors ${session === 'FN' ? 'text-purple-600' : ''}`}>FN</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        value="AN"
                        checked={session === 'AN'}
                        onChange={() => setSession('AN')}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${session === 'AN' ? 'border-purple-500 bg-purple-500' : 'border-gray-300 group-hover:border-purple-300'}`}>
                        {session === 'AN' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <span className={`text-gray-700 group-hover:text-purple-600 transition-colors ${session === 'AN' ? 'text-purple-600' : ''}`}>AN</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Hall</label>
                <input
                  type="text"
                  value={examHall}
                  onChange={(e) => setExamHall(e.target.value)}
                  placeholder="Hall name"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seating Grid</label>
                <div className="flex space-x-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={rows}
                      onChange={(e) => setRows(parseInt(e.target.value) || 7)}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Rows"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">r</div>
                  </div>
                  <span className="self-center text-gray-400">×</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={columns}
                      onChange={(e) => setColumns(parseInt(e.target.value) || 4)}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Cols"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">c</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                  placeholder="e.g., DS"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                <input
                  type="text"
                  value={currentCourseCode}
                  onChange={(e) => setCurrentCourseCode(e.target.value)}
                  placeholder="Course code"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                <input
                  type="text"
                  value={currentCourseTitle}
                  onChange={(e) => setCurrentCourseTitle(e.target.value)}
                  placeholder="Course title"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Register Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Register No.</label>
                <input
                  type="text"
                  value={startRegNo}
                  onChange={(e) => setStartRegNo(e.target.value.toUpperCase())}
                  placeholder="24PGDT001"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 font-mono uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Register No.</label>
                <input
                  type="text"
                  value={endRegNo}
                  onChange={(e) => setEndRegNo(e.target.value.toUpperCase())}
                  placeholder="24PGDT012"
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-800 font-mono uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Students</label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 blur-sm"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                      <span className="text-3xl font-bold text-white">{regCount > 0 ? regCount : '0'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">students</p>
                    <p className="text-xs text-gray-500">Auto-calculated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seating Preferences */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Fill Side First</label>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <label className={`relative cursor-pointer transition-all duration-300 ${fillSide === 'left' ? 'scale-105' : 'hover:scale-105'}`}>
                  <input
                    type="radio"
                    value="left"
                    checked={fillSide === 'left'}
                    onChange={() => setFillSide('left')}
                    className="sr-only"
                  />
                  <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${fillSide === 'left' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl text-white">
                        ⬅️
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-800">Left Side</div>
                        <div className="text-sm text-gray-600">Fill left seats first</div>
                      </div>
                    </div>
                  </div>
                </label>
                <label className={`relative cursor-pointer transition-all duration-300 ${fillSide === 'right' ? 'scale-105' : 'hover:scale-105'}`}>
                  <input
                    type="radio"
                    value="right"
                    checked={fillSide === 'right'}
                    onChange={() => setFillSide('right')}
                    className="sr-only"
                  />
                  <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${fillSide === 'right' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl text-white">
                        ➡️
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-800">Right Side</div>
                        <div className="text-sm text-gray-600">Fill right seats first</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Quick Stats in one row UNDER the side selection */}
              <div className="grid grid-cols-4 gap-4">
                {/* Total Seats */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Total Seats</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-800">{totalSeats}</div>
                    <div className="text-sm text-emerald-600 font-semibold">
                      {totalFilledSeats} filled
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(totalFilledSeats/totalSeats)*100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Left Side Available */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Left Available</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-800">{leftAvailableSeats}</div>
                    <div className="text-xs text-gray-500">
                      of {totalSeatsPerSide}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(leftAvailableSeats/totalSeatsPerSide)*100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Right Side Available */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Right Available</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-800">{rightAvailableSeats}</div>
                    <div className="text-xs text-gray-500">
                      of {totalSeatsPerSide}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(rightAvailableSeats/totalSeatsPerSide)*100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Total Students */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="text-sm text-emerald-600 mb-1">Total Students</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-emerald-700">{totalStudents}</div>
                    <div className="text-xs text-gray-500">
                      {courses.length} course{courses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Across all courses
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={saveAndAddCourse}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
                <span>Add Register no. to Seating</span>
              </button>
              <button
                onClick={clearAllCourses}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group"
              >
                <span className="text-xl group-hover:rotate-12 transition-transform">🗑️</span>
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Seating Arrangement Card - Now full width and outside the grid */}
{/* Seating Arrangement Card - Now full width and outside the grid */}
<div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
      <span className="mr-3 text-3xl text-purple-500">🪑</span>
      Seating Arrangement
    </h2>
    <div className="text-sm text-gray-600">
      Click any seat to edit • L = Left • R = Right
    </div>
  </div>
  
  <div className="overflow-x-auto rounded-2xl border border-purple-200 bg-purple-50/30 p-2">
    <table className="w-full">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <th key={colIndex} className="px-4 py-3 text-center">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800 text-lg">Column {colIndex + 1}</span>
                <span className={`text-xs ${colIndex % 2 === 0 ? 'text-purple-600' : 'text-pink-600'} font-medium`}>
                  {colIndex % 2 === 0 ? '↓ Top-Bottom' : '↑ Bottom-Top'}
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
              <td key={colIndex} className="p-2">
                <div className="flex h-28 bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105">
                  {/* Left Side */}
                  <div className="flex-1 relative border-r border-purple-200">
                    <div className="absolute top-2 left-2 text-xs text-purple-600/70 font-bold">L</div>
                    {editingCell && editingCell.row === rowIndex &&
                      editingCell.col === colIndex && editingCell.side === 'left' ? (
                      <div className="h-full flex items-center justify-center p-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full h-full px-3 text-sm bg-white border-2 border-purple-400 rounded-lg text-gray-800 text-center uppercase font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="h-full flex items-center justify-center cursor-pointer hover:bg-purple-50 transition-colors p-3"
                        onClick={() => handleCellClick(rowIndex, colIndex, 'left', col.left)}
                      >
                       <span className="text-sm font-mono text-gray-800 font-bold whitespace-normal">
  {col.left || ''}
</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Side */}
                  <div className="flex-1 relative">
                    <div className="absolute top-2 right-2 text-xs text-pink-600/70 font-bold">R</div>
                    {editingCell && editingCell.row === rowIndex &&
                      editingCell.col === colIndex && editingCell.side === 'right' ? (
                      <div className="h-full flex items-center justify-center p-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full h-full px-3 text-sm bg-white border-2 border-pink-400 rounded-lg text-gray-800 text-center uppercase font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="h-full flex items-center justify-center cursor-pointer hover:bg-pink-50 transition-colors p-3"
                        onClick={() => handleCellClick(rowIndex, colIndex, 'right', col.right)}
                      >
                       <span className="text-sm font-mono text-gray-800 font-bold whitespace-normal">
  {col.right || ''}
</span>

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
</div>

          {/* Right Column Sidebar - Now below everything in a grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Courses List */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="mr-3 text-3xl text-purple-500">📚</span>
                  Courses ({courses.length})
                </h2>
                <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <p className="text-lg font-bold text-white">{totalStudents} students</p>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200 hover:border-purple-300 transition-all duration-300 group hover:scale-[1.02]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-purple-700 text-lg">{course.department}</span>
                          <span className="ml-2 text-gray-700">{course.courseCode}</span>
                        </div>
                        <button
                          onClick={() => removeCourse(course.id)}
                          className="text-red-600 hover:text-red-500 text-sm px-3 py-1 rounded-lg bg-white hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.courseTitle}</p>
                      <div className="flex justify-between items-center">
                        <div className="font-mono text-gray-800 text-sm">
                          {course.startRegNo} - {course.endRegNo}
                        </div>
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                          {course.regCount} students
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4 opacity-30 text-purple-400">📚</div>
                    <p className="text-gray-500">No courses added yet</p>
                    <p className="text-gray-400 text-sm mt-2">Add your first course above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Preview */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
                <span className="mr-3 text-3xl text-purple-500">📊</span>
                Summary Preview
              </h2>
              
              <div className="overflow-x-auto rounded-xl border border-purple-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">Dept</th>
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">Code</th>
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">Title</th>
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">Total</th>
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">PRESENT</th>
                      <th className="px-4 py-3 text-center text-gray-700 font-bold">ABSENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <tr key={course.id} className="border-b border-purple-100 hover:bg-purple-50">
                          <td className="px-4 py-3 text-center text-gray-800">{course.department}</td>
                          <td className="px-4 py-3 text-center text-gray-800">{course.courseCode}</td>
                          <td className="px-4 py-3 text-center text-gray-600 truncate max-w-[80px]" title={course.courseTitle}>{course.courseTitle}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-sm font-bold text-white">
                              {course.regCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400">_______</td>
                          <td className="px-4 py-3 text-center text-gray-400">_______</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                          No courses added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {courses.length > 0 && (
                    <tfoot className="bg-purple-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-4 text-right text-gray-700 font-bold">
                          TOTAL STUDENTS:
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-lg font-bold text-white">
                            {totalStudents}
                          </span>
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              
              <div className="mt-8 pt-6 border-t border-purple-200 text-center">
                <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-3"></div>
                <p className="text-sm text-gray-600">Name and Signature of the Hall Superintendent</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-purple-200">
          <p>Hall Seating Arrangement System • Nehru Arts and Science College</p>
          <p className="text-xs mt-1">Click on any seat to edit register numbers</p>
        </div>
      </div>
    </div>
  );
}

export default App;
