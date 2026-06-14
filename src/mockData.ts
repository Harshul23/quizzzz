import { Exam, Submission } from './types';

// Let's create a realistic preset Exam
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'web-dev-101',
    title: 'Frontend Web Development Basics',
    description: 'Test your understanding of core HTML, CSS, JavaScript concepts, and responsive frameworks.',
    durationMinutes: 10,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    questions: [
      {
        id: 'q1',
        text: 'Which HTML5 element is used to encapsulate self-contained, independent content, like blog posts or articles?',
        options: ['<section>', '<div>', '<article>', '<aside>'],
        correctOptionIndex: 2,
        points: 10,
      },
      {
        id: 'q2',
        text: 'What does the CSS property flex-shrink: 0 do to a flex item?',
        options: [
          'Prevents the item from growing past its flex-basis size',
          'Prevents the item from shrinking when the container is smaller than its contents',
          'Force-fits the item to shrink before other sibling items shrink',
          'Aligns the item to the absolute bottom margin of the layout context'
        ],
        correctOptionIndex: 1,
        points: 10,
      },
      {
        id: 'q3',
        text: 'In JavaScript standard ES6, which of the following statements about "const" variables is true?',
        options: [
          'Their assigned value can be updated and re-assigned anywhere.',
          'Objects declared as const cannot have their properties modified.',
          'They have block scope and can never be re-assigned, but are not fully immutable.',
          'They are automatically hoisted to the global document object model.'
        ],
        correctOptionIndex: 2,
        points: 10,
      },
      {
        id: 'q4',
        text: 'Which function in React is used to defer computationally expensive calculations until specific dependencies change?',
        options: ['useEffect', 'useMemo', 'useCallback', 'useState'],
        correctOptionIndex: 1,
        points: 10,
      },
      {
        id: 'q5',
        text: 'In the Box Model, which layer is positioned directly between the padding and the margin?',
        options: ['Border', 'Content', 'Outline', 'Inward shadow'],
        correctOptionIndex: 0,
        points: 10,
      }
    ]
  },
  {
    id: 'alg-and-data',
    title: 'Data Structures & Algorithmic Analysis',
    description: 'Solve fundamental computer science questions on arrays, trees, binary searches, and big-O times.',
    durationMinutes: 15,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'algo-q1',
        text: 'What is the worst-case time complexity of inserting an element into a Binary Search Tree (BST) of height h?',
        options: ['O(1)', 'O(log n)', 'O(h)', 'O(n log n)'],
        correctOptionIndex: 2,
        points: 10,
      },
      {
        id: 'algo-q2',
        text: 'Which data structure follows the Last-In-First-Out (LIFO) protocol for storing elements?',
        options: ['Queue', 'Stack', 'Doubly Linked List', 'Hash Set'],
        correctOptionIndex: 1,
        points: 10,
      },
      {
        id: 'algo-q3',
        text: 'Which algorithm is best suited for finding the shortest path in a weighted graph with no negative edge weights?',
        options: ["Dijkstra's Algorithm", 'Kruskal\'s Algorithm', 'Depth-First Search', 'Floyd-Warshall Algorithm'],
        correctOptionIndex: 0,
        points: 10,
      }
    ]
  }
];

// Seed some student submissions
export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    examId: 'web-dev-101',
    studentName: 'Alex Mercer',
    studentEmail: 'alex.mercer@gmail.com',
    answers: [
      { questionId: 'q1', selectedOptionIndex: 2 }, // correct
      { questionId: 'q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'q3', selectedOptionIndex: 2 }, // correct
      { questionId: 'q4', selectedOptionIndex: 1 }, // correct
      { questionId: 'q5', selectedOptionIndex: 0 }  // correct
    ],
    score: 50,
    totalPoints: 50,
    percentage: 100,
    timeSpentSeconds: 240, // 4 mins
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    automatedGrade: 'A+',
    isSyncedToSheet: true
  },
  {
    id: 'sub-2',
    examId: 'web-dev-101',
    studentName: 'Sarah Jenkins',
    studentEmail: 's.jenkins@stanford.edu',
    answers: [
      { questionId: 'q1', selectedOptionIndex: 2 }, // correct
      { questionId: 'q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'q3', selectedOptionIndex: 0 }, // wrong (correct is 2)
      { questionId: 'q4', selectedOptionIndex: 1 }, // correct
      { questionId: 'q5', selectedOptionIndex: 0 }  // correct
    ],
    score: 40,
    totalPoints: 50,
    percentage: 80,
    timeSpentSeconds: 410, // 6.8 mins
    submittedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    automatedGrade: 'B',
    isSyncedToSheet: true
  },
  {
    id: 'sub-3',
    examId: 'web-dev-101',
    studentName: 'David Zhang',
    studentEmail: 'dzhang99@yahoo.com',
    answers: [
      { questionId: 'q1', selectedOptionIndex: 0 }, // wrong (correct matches 2)
      { questionId: 'q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'q3', selectedOptionIndex: 2 }, // correct
      { questionId: 'q4', selectedOptionIndex: 1 }, // correct
      { questionId: 'q5', selectedOptionIndex: 1 }  // wrong (correct matches 0)
    ],
    score: 30,
    totalPoints: 50,
    percentage: 60,
    timeSpentSeconds: 180, // 3 mins
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    automatedGrade: 'D',
    isSyncedToSheet: false
  },
  {
    id: 'sub-4',
    examId: 'web-dev-101',
    studentName: 'Amila Patel',
    studentEmail: 'amila.patel@outlook.com',
    answers: [
      { questionId: 'q1', selectedOptionIndex: 2 }, // correct
      { questionId: 'q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'q3', selectedOptionIndex: 2 }, // correct
      { questionId: 'q4', selectedOptionIndex: 0 }, // wrong (correct matches 1)
      { questionId: 'q5', selectedOptionIndex: 0 }  // correct
    ],
    score: 40,
    totalPoints: 50,
    percentage: 80,
    timeSpentSeconds: 320, // 5.3 mins
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    automatedGrade: 'B',
    isSyncedToSheet: false
  },
  {
    id: 'sub-5',
    examId: 'alg-and-data',
    studentName: 'Sarah Jenkins',
    studentEmail: 's.jenkins@stanford.edu',
    answers: [
      { questionId: 'algo-q1', selectedOptionIndex: 2 }, // correct
      { questionId: 'algo-q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'algo-q3', selectedOptionIndex: 0 }  // correct
    ],
    score: 30,
    totalPoints: 30,
    percentage: 100,
    timeSpentSeconds: 450, // 7.5 mins
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    automatedGrade: 'A+',
    isSyncedToSheet: true
  },
  {
    id: 'sub-6',
    examId: 'alg-and-data',
    studentName: 'Alex Mercer',
    studentEmail: 'alex.mercer@gmail.com',
    answers: [
      { questionId: 'algo-q1', selectedOptionIndex: 1 }, // wrong (correct matches 2)
      { questionId: 'algo-q2', selectedOptionIndex: 1 }, // correct
      { questionId: 'algo-q3', selectedOptionIndex: 0 }  // correct
    ],
    score: 20,
    totalPoints: 30,
    percentage: 66.67,
    timeSpentSeconds: 310, // 5.1 mins
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    automatedGrade: 'C',
    isSyncedToSheet: false
  }
];

export function computeGrade(percentage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}
