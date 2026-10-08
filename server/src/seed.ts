import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  School,
  User,
  AcademicYear,
  ClassSection,
  Subject,
  ClassSubjectAssignment,
  SchoolCalendarEvent,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  AttendanceRecord,
  Exam,
  GradeRecord,
  FeeHead,
  FeeStructure,
  FeeInvoice,
  Expense,
  Notice,
  Notification,
  Conversation,
  ChatMessage,
  Homework,
  HomeworkSubmission,
  Timetable,
  StudyMaterial,
  AuditLog,
  Quiz,
  QuizAttempt,
} from './models';
import {
  DEFAULT_TEACHER_PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSIONS,
} from '@eduhub/shared';

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('[EduHub Seed] MONGO_URI or MONGODB_URI environment variable is required.');
  }
  console.log('[EduHub Seed] Connecting to database...');
  await mongoose.connect(uri, { family: 4 });

  console.log('[EduHub Seed] Cleaning existing collections...');
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    AcademicYear.deleteMany({}),
    ClassSection.deleteMany({}),
    Subject.deleteMany({}),
    ClassSubjectAssignment.deleteMany({}),
    SchoolCalendarEvent.deleteMany({}),
    StudentProfile.deleteMany({}),
    TeacherProfile.deleteMany({}),
    ParentProfile.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Exam.deleteMany({}),
    GradeRecord.deleteMany({}),
    FeeHead.deleteMany({}),
    FeeStructure.deleteMany({}),
    FeeInvoice.deleteMany({}),
    Expense.deleteMany({}),
    Notice.deleteMany({}),
    Notification.deleteMany({}),
    Conversation.deleteMany({}),
    ChatMessage.deleteMany({}),
    Homework.deleteMany({}),
    HomeworkSubmission.deleteMany({}),
    Timetable.deleteMany({}),
    StudyMaterial.deleteMany({}),
    AuditLog.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({}),
  ]);

  console.log('[EduHub Seed] Creating institution: Adiya School of Excellence...');
  const school = await School.create({
    name: 'Adiya School of Excellence',
    code: 'ADIYA01',
    address: '14 Knowledge Park, Silicon Valley, Bengaluru, KA 560100',
    phone: '+91 80 4123 4567',
    email: 'admin@adiya.edu',
    website: 'https://adiya.edu',
    academicYear: '2025-2026',
    workingDays: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    branding: {
      primaryColor: '#f97316',
      secondaryColor: '#0284c7',
      tagline: 'Inspiring young minds towards leadership and academic brilliance',
      logoUrl: '',
    },
  });

  const schoolId = school._id;

  console.log('[EduHub Seed] Creating Academic Year 2025-2026...');
  const ayCurrent = await AcademicYear.create({
    schoolId,
    name: '2025-2026',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isCurrent: true,
    description: 'Current Active Academic Year 2025-2026',
  });

  const adminPass = await bcrypt.hash('Admin@123', 10);
  const teacherPass = await bcrypt.hash('Teacher@123', 10);
  const studentPass = await bcrypt.hash('Student@123', 10);
  const parentPass = await bcrypt.hash('Parent@123', 10);

  console.log('[EduHub Seed] Creating Administrator account...');
  const adminUser = await User.create({
    schoolId,
    email: 'admin@adiya.edu',
    passwordHash: adminPass,
    name: 'Principal Dr. Ramesh Iyer',
    role: 'admin',
    isActive: true,
    permissions: ALL_PERMISSIONS,
    phone: '+91 98800 11223',
  });

  console.log('[EduHub Seed] Creating 25 Teachers with realistic qualifications & specializations...');
  const teacherConfigs = [
    { empId: 'TCH-101', name: 'Rajesh Sharma', email: 'rajesh.sharma@adiya.edu', gender: 'male', phone: '+91 98450 12345', qual: 'M.Sc. Mathematics, B.Ed.', spec: 'Mathematics & Statistics', elevated: false },
    { empId: 'TCH-102', name: 'Priya Nair', email: 'priya.nair@adiya.edu', gender: 'female', phone: '+91 98450 23456', qual: 'M.Sc. Physics & Biology, M.Ed.', spec: 'Science & Biology', elevated: true },
    { empId: 'TCH-103', name: 'Ananya Sen', email: 'ananya.sen@adiya.edu', gender: 'female', phone: '+91 98450 34567', qual: 'M.A. English Literature, B.Ed.', spec: 'English Literature & Composition', elevated: false },
    { empId: 'TCH-104', name: 'Vikram Malhotra', email: 'vikram.malhotra@adiya.edu', gender: 'male', phone: '+91 98450 45678', qual: 'M.Tech Computer Science', spec: 'Information Technology & AI', elevated: false },
    { empId: 'TCH-105', name: 'Sunita Deshmukh', email: 'sunita.deshmukh@adiya.edu', gender: 'female', phone: '+91 98450 56789', qual: 'M.A. Hindi, B.Ed.', spec: 'Hindi Sahitya & Vyakaran', elevated: false },
    { empId: 'TCH-106', name: 'Amitav Ghosh', email: 'amitav.ghosh@adiya.edu', gender: 'male', phone: '+91 98450 67890', qual: 'M.A. History, B.Ed.', spec: 'Social Science & History', elevated: false },
    { empId: 'TCH-107', name: 'Meenakshi Sundaram', email: 'meenakshi.sundaram@adiya.edu', gender: 'female', phone: '+91 98450 78901', qual: 'M.A. Sanskrit, B.Ed.', spec: 'Sanskrit & Vedic Literature', elevated: false },
    { empId: 'TCH-108', name: 'Deepak Verma', email: 'deepak.verma@adiya.edu', gender: 'male', phone: '+91 98450 89012', qual: 'M.Sc. Chemistry, B.Ed.', spec: 'Science & Chemistry', elevated: false },
    { empId: 'TCH-109', name: 'Kavita Rao', email: 'kavita.rao@adiya.edu', gender: 'female', phone: '+91 98450 90123', qual: 'M.Sc. Mathematics, B.Ed.', spec: 'Mathematics & Geometry', elevated: false },
    { empId: 'TCH-110', name: 'Rohan Mukherjee', email: 'rohan.mukherjee@adiya.edu', gender: 'male', phone: '+91 98450 01234', qual: 'MCA, B.Sc. IT', spec: 'Computer Applications & Coding', elevated: false },
    { empId: 'TCH-111', name: 'Neha Kapoor', email: 'neha.kapoor@adiya.edu', gender: 'female', phone: '+91 98451 12345', qual: 'M.A. English, B.Ed.', spec: 'English Communication & Grammar', elevated: false },
    { empId: 'TCH-112', name: 'Suresh Pillai', email: 'suresh.pillai@adiya.edu', gender: 'male', phone: '+91 98451 23456', qual: 'B.Sc. Botany & Zoology, B.Ed.', spec: 'General Science & EVS', elevated: false },
    { empId: 'TCH-113', name: 'Shalini Gupta', email: 'shalini.gupta@adiya.edu', gender: 'female', phone: '+91 98451 34567', qual: 'B.Com, B.Ed.', spec: 'Primary Mathematics & Abacus', elevated: false },
    { empId: 'TCH-114', name: 'Manoj Joshi', email: 'manoj.joshi@adiya.edu', gender: 'male', phone: '+91 98451 45678', qual: 'B.A. Geography, B.Ed.', spec: 'Social Studies & Civics', elevated: false },
    { empId: 'TCH-115', name: 'Pooja Bhatia', email: 'pooja.bhatia@adiya.edu', gender: 'female', phone: '+91 98451 56789', qual: 'B.El.Ed. (Elementary Education)', spec: 'EVS & Environmental Activity', elevated: false },
    { empId: 'TCH-116', name: 'Alok Saxena', email: 'alok.saxena@adiya.edu', gender: 'male', phone: '+91 98451 67890', qual: 'BCA, B.Ed.', spec: 'Computer Basics & Multimedia', elevated: false },
    { empId: 'TCH-117', name: 'Divya Menon', email: 'divya.menon@adiya.edu', gender: 'female', phone: '+91 98451 78901', qual: 'B.A. English, B.Ed.', spec: 'English Phonics & Creative Prose', elevated: false },
    { empId: 'TCH-118', name: 'Harish Chandra', email: 'harish.chandra@adiya.edu', gender: 'male', phone: '+91 98451 89012', qual: 'B.A. Hindi, B.Ed.', spec: 'Hindi Vyakaran & Poetry', elevated: false },
    { empId: 'TCH-119', name: 'Ritu Agarwal', email: 'ritu.agarwal@adiya.edu', gender: 'female', phone: '+91 98451 90123', qual: 'D.El.Ed. (Diploma Elementary Ed)', spec: 'Foundational Numeracy & Math', elevated: false },
    { empId: 'TCH-120', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@adiya.edu', gender: 'female', phone: '+91 98452 01234', qual: 'D.El.Ed. (Diploma Elementary Ed)', spec: 'Early Childhood Literacy & EVS', elevated: false },
    { empId: 'TCH-121', name: 'Arjun Rampal', email: 'arjun.rampal@adiya.edu', gender: 'male', phone: '+91 98452 12345', qual: 'B.P.Ed. Physical Education', spec: 'Physical Education & Athletics', elevated: false },
    { empId: 'TCH-122', name: 'Vandana Tripathi', email: 'vandana.tripathi@adiya.edu', gender: 'female', phone: '+91 98452 23456', qual: 'M.A. Hindi & Sanskrit, B.Ed.', spec: 'Hindi & Indian Culture', elevated: false },
    { empId: 'TCH-123', name: 'Gaurav Singhania', email: 'gaurav.singhania@adiya.edu', gender: 'male', phone: '+91 98452 34567', qual: 'MCA, B.Sc. Electronics', spec: 'Computer Science & Robotics', elevated: false },
    { empId: 'TCH-124', name: 'Tanvi Sethi', email: 'tanvi.sethi@adiya.edu', gender: 'female', phone: '+91 98452 45678', qual: 'M.Sc. Life Sciences, B.Ed.', spec: 'Science & Experimental Labs', elevated: false },
    { empId: 'TCH-125', name: 'Sandeep Hegde', email: 'sandeep.hegde@adiya.edu', gender: 'male', phone: '+91 98452 56789', qual: 'M.Com, B.Ed.', spec: 'Applied Mathematics & Finance', elevated: false },
  ];

  const teacherUsers: any[] = [];
  const teacherProfiles: any[] = [];

  for (const tc of teacherConfigs) {
    const permissions = tc.elevated
      ? [
          ...DEFAULT_TEACHER_PERMISSIONS,
          PERMISSIONS.FEES_VIEW,
          PERMISSIONS.FEES_COLLECT,
          PERMISSIONS.RESULTS_PUBLISH,
          PERMISSIONS.ATTENDANCE_EDIT,
          PERMISSIONS.MARKS_EDIT,
          PERMISSIONS.HOMEWORK_GRADE,
          PERMISSIONS.TIMETABLE_MANAGE,
        ]
      : DEFAULT_TEACHER_PERMISSIONS;

    const tUser = await User.create({
      schoolId,
      email: tc.email,
      passwordHash: teacherPass,
      name: tc.name,
      role: 'teacher',
      isActive: true,
      permissions,
      phone: tc.phone,
    });

    const tProf = await TeacherProfile.create({
      schoolId,
      userId: tUser._id,
      employeeId: tc.empId,
      name: tc.name,
      email: tc.email,
      phone: tc.phone,
      gender: tc.gender as any,
      qualification: tc.qual,
      specialization: tc.spec,
      joiningDate: new Date('2022-06-15'),
      status: 'active',
    });

    teacherUsers.push(tUser);
    teacherProfiles.push(tProf);
  }

  console.log('[EduHub Seed] Creating 12 Centralized Reusable Subjects...');
  const subjectConfigs = [
    { name: 'English', code: 'ENG-CORE', desc: 'English Literature, Grammar, and Composition', type: 'core', credits: 4 },
    { name: 'Hindi', code: 'HIN-CORE', desc: 'Hindi Sahitya, Vyakaran, and Language Skills', type: 'core', credits: 4 },
    { name: 'Mathematics', code: 'MATH-CORE', desc: 'Arithmetic, Algebra, Geometry, and Advanced Math', type: 'core', credits: 4 },
    { name: 'EVS', code: 'EVS-CORE', desc: 'Environmental Studies and Nature Explorations', type: 'core', credits: 3 },
    { name: 'Computer', code: 'CS-CORE', desc: 'Computer Science, Digital Literacy, and Programming', type: 'core', credits: 3 },
    { name: 'GK', code: 'GK-CORE', desc: 'General Knowledge, Current Affairs, and Discovery', type: 'extracurricular', credits: 2 },
    { name: 'Science', code: 'SCI-CORE', desc: 'Physics, Chemistry, and Biology Principles', type: 'core', credits: 4 },
    { name: 'Social Studies', code: 'SST-PRI-CORE', desc: 'Elementary Social Studies, Community, and Geography', type: 'core', credits: 3 },
    { name: 'Social Science', code: 'SOC-CORE', desc: 'History, Civics, Geography, and Economics', type: 'core', credits: 4 },
    { name: 'Sanskrit', code: 'SAN-CORE', desc: 'Sanskrit Language, Vyakaran, and Classical Literature', type: 'core', credits: 3 },
    { name: 'Information Technology', code: 'IT-CORE', desc: 'Information Technology, Software, and Digital Systems', type: 'core', credits: 3 },
    { name: 'Physical Education', code: 'PE-CORE', desc: 'Physical Fitness, Sportsmanship, and Health Education', type: 'extracurricular', credits: 2 },
  ];

  const subjectsMap: Record<string, any> = {};
  for (const sc of subjectConfigs) {
    const sDoc = await Subject.create({
      schoolId,
      name: sc.name,
      code: sc.code,
      description: sc.desc,
      type: sc.type as any,
      credits: sc.credits,
    });
    subjectsMap[sc.name] = sDoc;
  }

  console.log('[EduHub Seed] Creating Class 1 to Class 10 with 2 Sections each (20 sections total)...');
  const classTeacherIndices: Record<string, number> = {
    '1-A': 18, '1-B': 19,
    '2-A': 16, '2-B': 17,
    '3-A': 14, '3-B': 15,
    '4-A': 12, '4-B': 13,
    '5-A': 11, '5-B': 2,
    '6-A': 9,  '6-B': 10,
    '7-A': 7,  '7-B': 8,
    '8-A': 5,  '8-B': 6,
    '9-A': 4,  '9-B': 1,
    '10-A': 0, '10-B': 3,
  };

  const sectionsList: Array<{ classNum: number; name: string; section: string; doc: any; classTeacher: any }> = [];

  for (let c = 1; c <= 10; c++) {
    for (const sec of ['A', 'B']) {
      const key = `${c}-${sec}`;
      const teacherIdx = classTeacherIndices[key];
      const teacherUser = teacherUsers[teacherIdx];

      const roomNum = `Room ${c * 10 + (sec === 'A' ? 1 : 2)}`;
      const classDoc = await ClassSection.create({
        schoolId,
        name: String(c),
        section: sec,
        roomNumber: roomNum,
        classTeacherId: teacherUser._id,
        academicYearId: ayCurrent._id,
        academicYear: '2025-2026',
        capacity: 40,
      });

      sectionsList.push({
        classNum: c,
        name: String(c),
        section: sec,
        doc: classDoc,
        classTeacher: teacherUser,
      });
    }
  }

  console.log('[EduHub Seed] Establishing Class-Subject Assignments according to grade requirements...');
  const assignmentsToCreate: any[] = [];

  for (const s of sectionsList) {
    const c = s.classNum;
    let requiredSubjectNames: string[] = [];

    if (c >= 1 && c <= 4) {
      requiredSubjectNames = ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer', 'GK'];
    } else if (c === 5) {
      requiredSubjectNames = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer', 'GK'];
    } else if (c >= 6 && c <= 8) {
      requiredSubjectNames = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Sanskrit'];
    } else if (c >= 9 && c <= 10) {
      requiredSubjectNames = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Information Technology', 'Physical Education'];
    }

    for (const subName of requiredSubjectNames) {
      const subjectDoc = subjectsMap[subName];
      let assignedTeacher = s.classTeacher;

      if (subName === 'Physical Education') {
        assignedTeacher = teacherUsers[20];
      } else if (subName === 'Sanskrit') {
        assignedTeacher = teacherUsers[6];
      } else if (subName === 'Information Technology') {
        assignedTeacher = teacherUsers[3];
      } else if (subName === 'Science') {
        if (c >= 9) assignedTeacher = teacherUsers[1];
        else if (c >= 7) assignedTeacher = teacherUsers[7];
        else assignedTeacher = teacherUsers[11];
      } else if (subName === 'Mathematics') {
        if (c >= 9) assignedTeacher = teacherUsers[0];
        else if (c >= 7) assignedTeacher = teacherUsers[8];
        else if (c >= 4) assignedTeacher = teacherUsers[12];
        else assignedTeacher = teacherUsers[18];
      } else if (subName === 'English') {
        if (c >= 9) assignedTeacher = teacherUsers[2];
        else if (c >= 6) assignedTeacher = teacherUsers[10];
        else assignedTeacher = teacherUsers[16];
      } else if (subName === 'Hindi') {
        if (c >= 9) assignedTeacher = teacherUsers[4];
        else if (c >= 5) assignedTeacher = teacherUsers[17];
        else assignedTeacher = teacherUsers[21];
      } else if (subName === 'Social Science' || subName === 'Social Studies') {
        if (c >= 8) assignedTeacher = teacherUsers[5];
        else assignedTeacher = teacherUsers[13];
      } else if (subName === 'Computer') {
        if (c >= 6) assignedTeacher = teacherUsers[9];
        else if (c >= 3) assignedTeacher = teacherUsers[15];
        else assignedTeacher = teacherUsers[22];
      } else if (subName === 'EVS') {
        if (c <= 2) assignedTeacher = teacherUsers[19];
        else assignedTeacher = teacherUsers[14];
      }

      assignmentsToCreate.push({
        schoolId,
        classSectionId: s.doc._id,
        subjectId: subjectDoc._id,
        teacherId: assignedTeacher._id,
      });
    }
  }

  await ClassSubjectAssignment.insertMany(assignmentsToCreate);

  console.log('[EduHub Seed] Creating Verified Parents and 100 Demo Students (5 per section)...');
  const parentSunitaUser = await User.create({
    schoolId,
    email: 'sunita.sharma@adiya.edu',
    passwordHash: parentPass,
    name: 'Sunita Sharma',
    role: 'parent',
    isActive: true,
    phone: '+91 97410 55667',
  });

  const studentPool: Array<[string, string, string]> = [
    ["Aditya", "Sharma", "male"], ["Anaya", "Iyer", "female"], ["Arnav", "Patel", "male"], ["Diya", "Nair", "female"], ["Ishaan", "Reddy", "male"],
    ["Kabir", "Mehta", "male"], ["Kiara", "Verma", "female"], ["Manan", "Joshi", "male"], ["Mira", "Chopra", "female"], ["Nivaan", "Kapoor", "male"],
    ["Prisha", "Malhotra", "female"], ["Reyansh", "Singh", "male"], ["Rhea", "Banerjee", "female"], ["Samarth", "Das", "male"], ["Saanvi", "Bhatia", "female"],
    ["Shaurya", "Kulkarni", "male"], ["Siya", "Deshmukh", "female"], ["Tanay", "Menon", "male"], ["Tara", "Pillai", "female"], ["Vedant", "Saxena", "male"],
    ["Aanya", "Tripathi", "female"], ["Advait", "Singhania", "male"], ["Ahana", "Hegde", "female"], ["Arya", "Aggarwal", "female"], ["Atharv", "Sethi", "male"],
    ["Avani", "Grover", "female"], ["Devansh", "Sen", "male"], ["Ira", "Pandey", "female"], ["Kian", "Mishra", "male"], ["Meera", "Dubey", "female"],
    ["Nirvaan", "Chatterjee", "male"], ["Pari", "Mukherjee", "female"], ["Raghav", "Bose", "male"], ["Riddhi", "Dutta", "female"], ["Rohan", "Chakraborty", "male"],
    ["Ruhi", "Goswami", "female"], ["Sai", "Natarajan", "male"], ["Sara", "Krishnan", "female"], ["Shlok", "Swaminathan", "male"], ["Myra", "Srinivasan", "female"],
    ["Vivaan", "Rao", "male"], ["Zoya", "Naidu", "female"], ["Aarush", "Gowda", "male"], ["Aditi", "Shetty", "female"], ["Akshat", "Poojary", "male"],
    ["Anika", "Bhandary", "female"], ["Ayush", "Kamath", "male"], ["Bhavya", "Pai", "female"], ["Darsh", "Nayaka", "male"], ["Vihaan", "Sharma", "male"],
    ["Dhruv", "Rathore", "male"], ["Esha", "Solanki", "female"], ["Hridaan", "Chauhan", "male"], ["Jiya", "Sisodia", "female"], ["Kavya", "Jadeja", "female"],
    ["Laksh", "Parmar", "male"], ["Navya", "Zala", "female"], ["Ojas", "Gohil", "male"], ["Pooja", "Barot", "female"], ["Pranav", "Vaghela", "male"],
    ["Rishi", "Bhatt", "male"], ["Samaira", "Rawal", "female"], ["Siddharth", "Trivedi", "male"], ["Trisha", "Vyas", "female"], ["Utkarsh", "Dave", "male"],
    ["Vansh", "Pandya", "male"], ["Vanya", "Thakar", "female"], ["Yash", "Oza", "male"], ["Aahana", "Mehta", "female"], ["Aarohi", "Shah", "female"],
    ["Arjun", "Parikh", "male"], ["Chirag", "Desai", "male"], ["Drishti", "Modi", "female"], ["Gaurang", "Soni", "male"], ["Harshita", "Panchal", "female"],
    ["Ishita", "Patwa", "female"], ["Jash", "Kothari", "male"], ["Krisha", "Gandhi", "female"], ["Manav", "Chokshi", "male"], ["Nitya", "Dalal", "female"],
    ["Om", "Bavishi", "male"], ["Parth", "Kapadia", "male"], ["Prisha", "Shah", "female"], ["Rishabh", "Merchant", "male"], ["Ritika", "Gheewala", "female"],
    ["Ananya", "Sharma", "female"], ["Soham", "Nanavati", "male"], ["Tanvi", "Vakil", "female"], ["Tejas", "Dhabuwala", "male"], ["Urvi", "Diwan", "female"],
    ["Aarav", "Sharma", "male"], ["Rohan", "Verma", "male"], ["Maya", "Iyer", "female"], ["Kunal", "Patel", "male"], ["Tanya", "Reddy", "female"],
    ["Varun", "Malhotra", "male"], ["Neha", "Deshmukh", "female"], ["Karthik", "Menon", "male"], ["Simran", "Kapoor", "female"], ["Abhinav", "Joshi", "male"]
  ];

  const allStudentDocs: any[] = [];
  const sunitaLinkedStudentIds: any[] = [];

  for (let sIdx = 0; sIdx < sectionsList.length; sIdx++) {
    const secInfo = sectionsList[sIdx];
    const startIndex = sIdx * 5;

    for (let r = 1; r <= 5; r++) {
      const studentIndex = startIndex + (r - 1);
      const studentInfo = studentPool[studentIndex];
      const firstName = studentInfo[0];
      const lastName = studentInfo[1];
      const gender = studentInfo[2];
      const fullName = `${firstName} ${lastName}`;

      const admSeq = String(studentIndex + 1).padStart(4, '0');
      const admNum = `ADM-2025-${admSeq}`;

      let studentEmail = `student.${secInfo.name.toLowerCase()}${secInfo.section.toLowerCase()}.${r}@adiya.edu`;
      let studentUserEmail = studentEmail;

      if (secInfo.name === '10' && secInfo.section === 'A' && r === 1) {
        studentUserEmail = 'aarav.sharma@adiya.edu';
      } else if (secInfo.name === '9' && secInfo.section === 'B' && r === 1) {
        studentUserEmail = 'ananya.sharma@adiya.edu';
      } else if (secInfo.name === '5' && secInfo.section === 'B' && r === 5) {
        studentUserEmail = 'vihaan.sharma@adiya.edu';
      }

      let assignedParentUser: any = null;
      let parentRelationship: 'father' | 'mother' = r % 2 === 0 ? 'father' : 'mother';

      if (studentUserEmail === 'aarav.sharma@adiya.edu' || studentUserEmail === 'vihaan.sharma@adiya.edu') {
        assignedParentUser = parentSunitaUser;
        parentRelationship = 'mother';
      } else {
        const parentName = parentRelationship === 'father' ? `Mr. Rajesh ${lastName}` : `Mrs. Anita ${lastName}`;
        const pEmail = `parent.${admSeq}@adiya.edu`;
        const pPhone = `+91 97410 ${String(10000 + studentIndex).slice(1)}`;

        assignedParentUser = await User.create({
          schoolId,
          email: pEmail,
          passwordHash: parentPass,
          name: parentName,
          role: 'parent',
          isActive: true,
          phone: pPhone,
        });

        await ParentProfile.create({
          schoolId,
          userId: assignedParentUser._id,
          name: parentName,
          email: pEmail,
          phone: pPhone,
          relationship: parentRelationship,
          occupation: 'Professional Consultant',
          address: `Indiranagar Sector ${secInfo.classNum}, Bengaluru, KA`,
          linkedStudentUserIds: [],
        });
      }

      const birthYear = 2025 - (secInfo.classNum + 5);
      const dob = new Date(`${birthYear}-0${(r % 9) + 1}-15`);
      const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'];
      const bloodGroup = bloodGroups[studentIndex % bloodGroups.length];

      const sUser = await User.create({
        schoolId,
        email: studentUserEmail,
        passwordHash: studentPass,
        name: fullName,
        role: 'student',
        isActive: true,
        permissions: [],
      });

      const sProf = await StudentProfile.create({
        schoolId,
        userId: sUser._id,
        admissionNumber: admNum,
        rollNumber: String(r),
        name: fullName,
        email: studentUserEmail,
        gender: gender as any,
        dateOfBirth: dob,
        bloodGroup,
        classSectionId: secInfo.doc._id,
        parentIds: [assignedParentUser._id],
        parentName: assignedParentUser.name,
        parentEmail: assignedParentUser.email,
        parentPhone: assignedParentUser.phone,
        parentRelationship,
        address: `Indiranagar Sector ${secInfo.classNum}, Bengaluru, KA`,
        emergencyContact: assignedParentUser.phone,
        status: 'active',
      });

      if (assignedParentUser._id.equals(parentSunitaUser._id)) {
        sunitaLinkedStudentIds.push(sUser._id);
      } else {
        await ParentProfile.updateOne(
          { userId: assignedParentUser._id },
          { $push: { linkedStudentUserIds: sUser._id } }
        );
      }

      allStudentDocs.push({
        user: sUser,
        profile: sProf,
        sectionInfo: secInfo,
        roll: r,
      });
    }
  }

  await ParentProfile.create({
    schoolId,
    userId: parentSunitaUser._id,
    name: 'Sunita Sharma',
    email: 'sunita.sharma@adiya.edu',
    phone: '+91 97410 55667',
    relationship: 'mother',
    occupation: 'Lead Architect',
    address: 'Indiranagar, Bengaluru, KA',
    linkedStudentUserIds: sunitaLinkedStudentIds,
  });

  const aaravStudent = allStudentDocs.find(s => s.user.email === 'aarav.sharma@adiya.edu')!;
  const ananyaStudent = allStudentDocs.find(s => s.user.email === 'ananya.sharma@adiya.edu')!;

  console.log('[EduHub Seed] Seeding Attendance Records across all 20 sections...');
  const attendanceDates = [
    '2026-09-18',
    '2026-09-19',
    '2026-09-21',
    '2026-09-22',
    '2026-09-23',
    new Date().toISOString().split('T')[0],
  ];

  for (const curDate of attendanceDates) {
    for (const sec of sectionsList) {
      const secStudents = allStudentDocs.filter(s => s.sectionInfo.doc._id.equals(sec.doc._id));
      const records = secStudents.map(st => {
        let status: 'present' | 'late' | 'absent' = 'present';
        let remarks = 'Punctual and attentive';

        if (st.roll === 2 && curDate === '2026-09-19') {
          status = 'late';
          remarks = 'Traffic delay';
        } else if (st.roll === 4 && curDate === '2026-09-22') {
          status = 'absent';
          remarks = 'Medical leave';
        }

        return {
          studentId: st.user._id,
          studentName: st.profile.name,
          rollNumber: st.profile.rollNumber,
          status,
          remarks,
        };
      });

      await AttendanceRecord.create({
        schoolId,
        classSectionId: sec.doc._id,
        date: curDate,
        records,
        takenById: sec.classTeacher._id,
        takenByName: sec.classTeacher.name,
        takenByRole: 'teacher',
        isEdited: false,
      });
    }
  }

  console.log('[EduHub Seed] Creating Fee Heads, Fee Structures, and Invoices...');
  const headTuition = await FeeHead.create({
    schoolId,
    academicYearId: ayCurrent._id,
    title: 'Tuition Fee (Quarterly)',
    amount: 14000,
    frequency: 'quarterly',
    description: 'Core instructional fee',
  });

  const headLab = await FeeHead.create({
    schoolId,
    academicYearId: ayCurrent._id,
    title: 'Computer & Science Lab Charge',
    amount: 3000,
    frequency: 'yearly',
    description: 'Lab resources and consumables',
  });

  const headAmenities = await FeeHead.create({
    schoolId,
    academicYearId: ayCurrent._id,
    title: 'Library & Sports Amenities',
    amount: 1500,
    frequency: 'yearly',
    description: 'Library access and athletic equipment',
  });

  const class10A = sectionsList.find(s => s.name === '10' && s.section === 'A')!.doc;
  const class9B = sectionsList.find(s => s.name === '9' && s.section === 'B')!.doc;

  await FeeStructure.create({
    schoolId,
    name: 'Class 10 Standard Fee Structure',
    classSectionId: class10A._id,
    academicYearId: ayCurrent._id,
    feeHeadIds: [headTuition._id, headLab._id, headAmenities._id],
    totalAmount: 18500,
    isActive: true,
  });

  await FeeInvoice.create({
    schoolId,
    invoiceNumber: 'INV-2026-00101',
    studentId: aaravStudent.user._id,
    classSectionId: class10A._id,
    academicYearId: ayCurrent._id,
    title: 'Term 1 Tuition & Lab Fee',
    dueDate: '2026-08-15',
    subtotal: 18500,
    concessionAmount: 0,
    totalAmount: 18500,
    paidAmount: 18500,
    balance: 0,
    status: 'paid',
    items: [
      { title: 'Tuition Fee (Quarterly)', amount: 14000 },
      { title: 'Computer & Science Lab Charge', amount: 3000 },
      { title: 'Library & Sports Amenities', amount: 1500 },
    ],
    payments: [
      {
        receiptNumber: 'REC-2026-00101',
        amount: 18500,
        paymentDate: new Date('2026-08-10'),
        paymentMethod: 'online',
        transactionRef: 'UPI-984210344',
        recordedById: adminUser._id,
        recordedByName: adminUser.name,
        notes: 'Paid via parent portal',
      },
    ],
  });

  await FeeInvoice.create({
    schoolId,
    invoiceNumber: 'INV-2026-00102',
    studentId: aaravStudent.user._id,
    classSectionId: class10A._id,
    academicYearId: ayCurrent._id,
    title: 'Term 2 Tuition & Activity Fee',
    dueDate: '2026-11-15',
    subtotal: 18500,
    concessionAmount: 0,
    totalAmount: 18500,
    paidAmount: 5000,
    balance: 13500,
    status: 'partial',
    items: [
      { title: 'Tuition Fee (Quarterly)', amount: 14000 },
      { title: 'Educational Tour & Robotics Workshop', amount: 4500 },
    ],
    payments: [
      {
        receiptNumber: 'REC-2026-00102',
        amount: 5000,
        paymentDate: new Date('2026-09-05'),
        paymentMethod: 'card',
        transactionRef: 'POS-88310',
        recordedById: adminUser._id,
        recordedByName: adminUser.name,
        notes: 'Advance installment',
      },
    ],
  });

  await FeeInvoice.create({
    schoolId,
    invoiceNumber: 'INV-2026-00103',
    studentId: ananyaStudent.user._id,
    classSectionId: class9B._id,
    academicYearId: ayCurrent._id,
    title: 'Term 1 Tuition & Transport Fee',
    dueDate: '2026-09-30',
    subtotal: 22000,
    concessionAmount: 0,
    totalAmount: 22000,
    paidAmount: 0,
    balance: 22000,
    status: 'unpaid',
    items: [
      { title: 'Tuition Fee', amount: 14000 },
      { title: 'School Bus Transport', amount: 8000 },
    ],
    payments: [],
  });

  for (let idx = 0; idx < 18; idx++) {
    const s = allStudentDocs[idx * 5];
    if (s.user.email === aaravStudent.user.email || s.user.email === ananyaStudent.user.email) continue;
    const invNum = `INV-2026-002${String(idx).padStart(2, '0')}`;
    const isPaid = idx % 2 === 0;

    await FeeInvoice.create({
      schoolId,
      invoiceNumber: invNum,
      studentId: s.user._id,
      classSectionId: s.sectionInfo.doc._id,
      academicYearId: ayCurrent._id,
      title: 'Term 1 General Composite Fee',
      dueDate: '2026-10-15',
      subtotal: 15000,
      concessionAmount: 0,
      totalAmount: 15000,
      paidAmount: isPaid ? 15000 : 0,
      balance: isPaid ? 0 : 15000,
      status: isPaid ? 'paid' : 'unpaid',
      items: [
        { title: 'Composite Tuition & Amenities Fee', amount: 15000 }
      ],
      payments: isPaid ? [
        {
          receiptNumber: `REC-2026-002${String(idx).padStart(2, '0')}`,
          amount: 15000,
          paymentDate: new Date('2026-08-20'),
          paymentMethod: 'online',
          transactionRef: `TXN-${10000 + idx}`,
          recordedById: adminUser._id,
          recordedByName: adminUser.name,
          notes: 'Standard fee remittance',
        }
      ] : [],
    });
  }

  console.log('[EduHub Seed] Creating Exams and Grade Records...');
  const subjectMath = subjectsMap['Mathematics'];
  const subjectScience = subjectsMap['Science'];
  const subjectEnglish = subjectsMap['English'];
  const teacherRajesh = teacherUsers[0];
  const teacherPriya = teacherUsers[1];
  const teacherAnanya = teacherUsers[2];

  const testUnit1 = await Exam.create({
    schoolId,
    name: 'Unit Test 1 - Algebra & Mechanics',
    type: 'unit_test',
    classSectionId: class10A._id,
    academicYear: '2025-2026',
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    status: 'marks-entry',
    maxMarks: 50,
    passingMarks: 20,
    subjects: [
      {
        subjectId: subjectMath._id,
        subjectName: 'Mathematics',
        maxMarks: 50,
        passingMarks: 20,
      },
      {
        subjectId: subjectScience._id,
        subjectName: 'Science',
        maxMarks: 50,
        passingMarks: 20,
      },
    ],
    description: 'Unit test evaluation for foundational chapters',
  });

  await GradeRecord.create({
    schoolId,
    examId: testUnit1._id,
    classSectionId: class10A._id,
    subjectId: subjectMath._id,
    maxMarks: 50,
    passingMarks: 20,
    grades: [
      {
        studentId: aaravStudent.user._id,
        studentName: aaravStudent.profile.name,
        rollNumber: aaravStudent.profile.rollNumber,
        marksObtained: 46,
        isAbsent: false,
        grade: 'A+',
        isPassed: true,
        remarks: 'Draft evaluation pending final teacher review',
      },
    ],
    enteredById: teacherRajesh._id,
    status: 'draft',
  });

  const examTerm1 = await Exam.create({
    schoolId,
    name: 'Term 1 Mid-Term Examination 2026',
    type: 'term_exam',
    classSectionId: class10A._id,
    academicYear: '2025-2026',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    status: 'published',
    maxMarks: 100,
    passingMarks: 40,
    subjects: [
      {
        subjectId: subjectMath._id,
        subjectName: 'Mathematics',
        maxMarks: 100,
        passingMarks: 40,
      },
      {
        subjectId: subjectScience._id,
        subjectName: 'Science',
        maxMarks: 100,
        passingMarks: 40,
      },
      {
        subjectId: subjectEnglish._id,
        subjectName: 'English',
        maxMarks: 100,
        passingMarks: 40,
      },
    ],
    description: 'Official Mid-Term Examination covering full term syllabus',
  });

  await GradeRecord.create({
    schoolId,
    examId: examTerm1._id,
    classSectionId: class10A._id,
    subjectId: subjectMath._id,
    maxMarks: 100,
    passingMarks: 40,
    grades: [
      {
        studentId: aaravStudent.user._id,
        studentName: aaravStudent.profile.name,
        rollNumber: aaravStudent.profile.rollNumber,
        marksObtained: 94,
        isAbsent: false,
        grade: 'A+',
        isPassed: true,
        remarks: 'Outstanding conceptual mastery in algebra and geometry',
      },
    ],
    enteredById: teacherRajesh._id,
    status: 'published',
    publishedAt: new Date('2026-09-12'),
    publishedById: adminUser._id,
    publishedByName: adminUser.name,
  });

  await GradeRecord.create({
    schoolId,
    examId: examTerm1._id,
    classSectionId: class10A._id,
    subjectId: subjectScience._id,
    maxMarks: 100,
    passingMarks: 40,
    grades: [
      {
        studentId: aaravStudent.user._id,
        studentName: aaravStudent.profile.name,
        rollNumber: aaravStudent.profile.rollNumber,
        marksObtained: 91,
        isAbsent: false,
        grade: 'A+',
        isPassed: true,
        remarks: 'Excellent analytical presentation in science',
      },
    ],
    enteredById: teacherPriya._id,
    status: 'published',
    publishedAt: new Date('2026-09-12'),
    publishedById: adminUser._id,
    publishedByName: adminUser.name,
  });

  await GradeRecord.create({
    schoolId,
    examId: examTerm1._id,
    classSectionId: class10A._id,
    subjectId: subjectEnglish._id,
    maxMarks: 100,
    passingMarks: 40,
    grades: [
      {
        studentId: aaravStudent.user._id,
        studentName: aaravStudent.profile.name,
        rollNumber: aaravStudent.profile.rollNumber,
        marksObtained: 88,
        isAbsent: false,
        grade: 'A',
        isPassed: true,
        remarks: 'Strong vocabulary and persuasive articulation',
      },
    ],
    enteredById: teacherAnanya._id,
    status: 'published',
    publishedAt: new Date('2026-09-12'),
    publishedById: adminUser._id,
    publishedByName: adminUser.name,
  });

  console.log('[EduHub Seed] Creating Homework and Submissions...');
  const hw1 = await Homework.create({
    schoolId,
    title: 'Quadratic Equations Problem Set 4.2',
    description: 'Solve questions 1 through 15 from Chapter 4. Submit neat handwritten steps or a scanned PDF.',
    classSectionId: class10A._id,
    subjectId: subjectMath._id,
    assignedDate: '2026-09-20',
    dueDate: '2026-09-28',
    teacherId: teacherRajesh._id,
    maxMarks: 50,
    status: 'published',
    attachments: [
      {
        fileName: 'Algebra_Problem_Set_4_2.pdf',
        fileUrl: '/uploads/homework/sample-algebra.pdf',
      },
    ],
    submissionCount: 1,
  });

  await HomeworkSubmission.create({
    schoolId,
    homeworkId: hw1._id,
    studentId: aaravStudent.user._id,
    studentName: aaravStudent.profile.name,
    rollNumber: aaravStudent.profile.rollNumber,
    classSectionId: class10A._id,
    submissionText: 'All 15 problems solved using the quadratic formula and factorization methods.',
    attachments: [
      {
        fileName: 'Aarav_Sharma_Math_Solutions.pdf',
        fileUrl: '/uploads/homework/aarav_math.pdf',
      },
    ],
    submittedAt: new Date('2026-09-22'),
    isLate: false,
    status: 'submitted',
  });

  await Homework.create({
    schoolId,
    title: 'Chemical Reactions and Stoichiometry Practice',
    description: 'Balance chemical equations in Exercise 3.1 and calculate the molar mass of reaction products. Identify oxidation-reduction pairs.',
    classSectionId: class10A._id,
    subjectId: subjectScience._id,
    assignedDate: '2026-09-24',
    dueDate: '2026-09-30',
    teacherId: teacherPriya._id,
    maxMarks: 30,
    status: 'published',
    aiHintsEnabled: true,
    submissionCount: 0,
  });

  await Homework.create({
    schoolId,
    title: 'Plant Photosynthesis & Respiration Lab Notes',
    description: 'Document observations from the chloroplast staining experiment conducted on Monday.',
    classSectionId: class9B._id,
    subjectId: subjectScience._id,
    assignedDate: '2026-09-22',
    dueDate: '2026-09-29',
    teacherId: teacherPriya._id,
    maxMarks: 25,
    status: 'published',
    submissionCount: 0,
  });

  console.log('[EduHub Seed] Seeding Timetable, Study Materials, Notices, Chat & Extras...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timetableSlots10A = [];

  for (const day of days) {
    timetableSlots10A.push(
      {
        schoolId,
        classSectionId: class10A._id,
        academicYearId: ayCurrent._id,
        dayOfWeek: day,
        periodNumber: 1,
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        subjectId: subjectMath._id,
        teacherId: teacherRajesh._id,
        roomNumber: 'Room 301',
      },
      {
        schoolId,
        classSectionId: class10A._id,
        academicYearId: ayCurrent._id,
        dayOfWeek: day,
        periodNumber: 2,
        startTime: '09:45 AM',
        endTime: '10:30 AM',
        subjectId: subjectScience._id,
        teacherId: teacherPriya._id,
        roomNumber: 'Science Lab',
      },
      {
        schoolId,
        classSectionId: class10A._id,
        academicYearId: ayCurrent._id,
        dayOfWeek: day,
        periodNumber: 3,
        startTime: '10:45 AM',
        endTime: '11:30 AM',
        subjectId: subjectEnglish._id,
        teacherId: teacherAnanya._id,
        roomNumber: 'Room 301',
      }
    );
  }

  await Timetable.create(timetableSlots10A);

  await StudyMaterial.create([
    {
      schoolId,
      title: 'Mathematics: Quadratic Equations and Factorization Formula Sheet',
      description: 'Essential algebraic identities, discriminant properties, and roots formula card.',
      classSectionId: class10A._id,
      subjectId: subjectMath._id,
      fileUrl: '/uploads/materials/Math_Quadratic_Formula_Sheet.pdf',
      fileName: 'Math_Quadratic_Formula_Sheet.pdf',
      fileSize: 1240000,
      fileType: 'pdf',
      uploadedById: teacherRajesh._id,
    },
    {
      schoolId,
      title: 'Science: Chemical Reactions & Ionic Balances Lab Guide',
      description: 'Periodic table charts, valence diagrams, and stoichiometry guide.',
      classSectionId: class10A._id,
      subjectId: subjectScience._id,
      fileUrl: '/uploads/materials/Science_Chemistry_Guide.pdf',
      fileName: 'Science_Chemistry_Guide.pdf',
      fileSize: 3200000,
      fileType: 'pdf',
      uploadedById: teacherPriya._id,
    },
  ]);

  await Notice.create([
    {
      schoolId,
      title: 'Annual Inter-School Science & Innovation Fair 2026',
      content: 'Adiya School of Excellence is proud to host the 2026 Science & Innovation Expo. Students from Grades 8-10 are invited to register working exhibits and research posters by October 5th.',
      targetRole: 'all',
      authorId: adminUser._id,
      authorName: adminUser.name,
      authorRole: 'admin',
      category: 'academic',
      isPinned: true,
      status: 'published',
    },
    {
      schoolId,
      title: 'Class 10 Parent-Teacher Meeting (PTM)',
      content: 'The First Term Parent-Teacher Conference takes place this Saturday from 09:30 AM to 01:00 PM. Parents can review answer sheets, examine term results, and consult subject faculty.',
      targetRole: 'parents',
      authorId: adminUser._id,
      authorName: adminUser.name,
      authorRole: 'admin',
      category: 'event',
      isPinned: false,
      status: 'published',
    },
    {
      schoolId,
      title: 'Faculty Workshop: Diagnostic Assessment & Feedback Tools',
      content: 'All teachers are requested to attend a professional development session on formative learning assessments this Friday at 03:30 PM in the Audio-Visual Hall.',
      targetRole: 'teachers',
      authorId: adminUser._id,
      authorName: adminUser.name,
      authorRole: 'admin',
      category: 'administrative',
      isPinned: false,
      status: 'published',
    },
  ]);

  const chatConv = await Conversation.create({
    schoolId,
    type: 'teacher_parent',
    title: 'Academic Consultation: Aarav Sharma',
    participantIds: [teacherRajesh._id, parentSunitaUser._id],
    participants: [
      { userId: teacherRajesh._id, role: 'teacher', name: teacherRajesh.name },
      { userId: parentSunitaUser._id, role: 'parent', name: parentSunitaUser.name },
    ],
    lastMessage: {
      text: 'Applied mechanics would be excellent! He can integrate the calculus basics we covered last week.',
      senderId: teacherRajesh._id,
      senderName: teacherRajesh.name,
      createdAt: new Date(),
    },
    lastMessageAt: new Date(),
  });

  await ChatMessage.create([
    {
      schoolId,
      conversationId: chatConv._id,
      senderId: teacherRajesh._id,
      senderName: teacherRajesh.name,
      senderRole: 'teacher',
      message: 'Hello Mrs. Sharma, Aarav has shown outstanding progress in Algebra this term. His problem-solving rigor in quadratic equations is commendable.',
      readBy: [teacherRajesh._id, parentSunitaUser._id],
    },
    {
      schoolId,
      conversationId: chatConv._id,
      senderId: parentSunitaUser._id,
      senderName: parentSunitaUser.name,
      senderRole: 'parent',
      message: 'Thank you so much Mr. Sharma! We are thrilled with his progress. He mentioned the upcoming Science & Innovation Fair model—should he focus on applied mechanics or robotics?',
      readBy: [teacherRajesh._id, parentSunitaUser._id],
    },
    {
      schoolId,
      conversationId: chatConv._id,
      senderId: teacherRajesh._id,
      senderName: teacherRajesh.name,
      senderRole: 'teacher',
      message: 'Applied mechanics would be excellent! He can integrate the calculus basics we covered last week.',
      readBy: [teacherRajesh._id],
    },
  ]);

  await Expense.create({
    schoolId,
    category: 'supplies',
    title: 'Term 1 Answer Booklets and Science Lab Glassware',
    amount: 14500,
    paymentDate: new Date('2026-09-15'),
    payee: 'Universal School Stationers & Lab House',
    paymentMethod: 'bank_transfer',
    description: 'Exam stationery and test tubes for upcoming assessments',
    recordedById: adminUser._id,
    recordedByName: adminUser.name,
  });

  await AuditLog.create([
    {
      schoolId,
      userId: adminUser._id,
      userName: adminUser.name,
      userRole: 'admin',
      action: 'RESULT_PUBLISH',
      entityType: 'grade',
      entityId: examTerm1._id.toString(),
      details: 'Published official Term 1 Mid-Term Examination results for Class 10A.',
      ipAddress: '127.0.0.1',
    },
    {
      schoolId,
      userId: adminUser._id,
      userName: adminUser.name,
      userRole: 'admin',
      action: 'FEE_PAYMENT',
      entityType: 'fee',
      details: 'Recorded tuition fee payment receipt REC-2026-00101 (₹18,500) for Aarav Sharma.',
      ipAddress: '127.0.0.1',
    },
  ]);

  await Notification.create([
    {
      schoolId,
      userId: aaravStudent.user._id,
      title: 'Term 1 Results Published',
      message: 'Official report card results for Term 1 Mid-Term Examination are now published.',
      type: 'grade',
      isRead: false,
    },
    {
      schoolId,
      userId: parentSunitaUser._id,
      title: 'Tuition Fee Confirmation',
      message: 'Payment of ₹18,500 for Aarav Sharma recorded successfully. Receipt #REC-2026-00101.',
      type: 'fee',
      isRead: false,
    },
  ]);

  console.log('[EduHub Seed] Seeding Subject Quizzes with 10 questions each...');
  const mathQuiz = await Quiz.create({
    schoolId,
    title: 'Algebra & Trigonometry Mastery Quiz',
    description: '10 fundamental questions evaluating quadratic formulas, discriminants, and trigonometric identities.',
    subjectId: subjectMath._id,
    subjectName: 'Mathematics',
    classSectionId: class10A._id,
    classSectionName: 'Class 10 - Section A',
    academicYearId: ayCurrent._id,
    teacherId: teacherRajesh._id,
    duration: 15,
    totalMarks: 10,
    passingMarks: 6,
    dueDate: '2026-10-05',
    status: 'published',
    allowReview: true,
    attemptCount: 1,
    questions: [
      { id: 'math_q1', questionText: 'What is the discriminant of the quadratic equation 2x^2 - 4x + 2 = 0?', questionType: 'mcq', options: ['0', '4', '-8', '16'], correctAnswer: '0', explanation: 'Discriminant D = b^2 - 4ac = (-4)^2 - 4(2)(2) = 16 - 16 = 0.', marks: 1, difficulty: 'medium' },
      { id: 'math_q2', questionText: 'What is the value of sin(90° - θ)?', questionType: 'mcq', options: ['cos(θ)', 'tan(θ)', 'cot(θ)', '-cos(θ)'], correctAnswer: 'cos(θ)', explanation: 'By complementary angle identities, sin(90° - θ) = cos(θ).', marks: 1, difficulty: 'easy' },
      { id: 'math_q3', questionText: 'If the roots of ax^2 + bx + c = 0 are real and equal, what condition must hold?', questionType: 'mcq', options: ['b^2 - 4ac = 0', 'b^2 - 4ac > 0', 'b^2 - 4ac < 0', 'b = 0'], correctAnswer: 'b^2 - 4ac = 0', explanation: 'A quadratic equation has real and equal roots when the discriminant is zero.', marks: 1, difficulty: 'easy' },
      { id: 'math_q4', questionText: 'The value of tan(45°) is equal to 1.', questionType: 'true_false', options: ['True', 'False'], correctAnswer: 'True', explanation: 'In a right-angled isosceles triangle, tan(45°) = 1.', marks: 1, difficulty: 'easy' },
      { id: 'math_q5', questionText: 'A quadratic equation can have three distinct roots in the complex number field.', questionType: 'true_false', options: ['True', 'False'], correctAnswer: 'False', explanation: 'A degree 2 polynomial has at most 2 distinct roots.', marks: 1, difficulty: 'medium' },
      { id: 'math_q6', questionText: 'The standard quadratic formula for ax^2 + bx + c = 0 has numerator -b ± √(______).', questionType: 'fill_in_the_blank', options: [], correctAnswer: 'b^2 - 4ac', explanation: 'The discriminant expression under the radical is b^2 - 4ac.', marks: 1, difficulty: 'medium' },
      { id: 'math_q7', questionText: 'In a right triangle, the ratio of opposite side to hypotenuse is called the ______ function.', questionType: 'fill_in_the_blank', options: [], correctAnswer: 'sine', explanation: 'Sine is defined as opposite side over hypotenuse.', marks: 1, difficulty: 'easy' },
      { id: 'math_q8', questionText: 'What is the simplified value of sin^2(θ) + cos^2(θ)?', questionType: 'short_answer', options: [], correctAnswer: '1', explanation: 'Pythagorean identity is always 1.', marks: 1, difficulty: 'easy' },
      { id: 'math_q9', questionText: 'What is the 10th term of the arithmetic progression 3, 7, 11, 15, ...?', questionType: 'mcq', options: ['39', '40', '36', '43'], correctAnswer: '39', explanation: 'First term a = 3, d = 4. 10th term = 3 + 9(4) = 39.', marks: 1, difficulty: 'medium' },
      { id: 'math_q10', questionText: 'The Euclidean distance of point P(3, 4) from origin (0, 0) is:', questionType: 'mcq', options: ['5', '7', '25', '1'], correctAnswer: '5', explanation: 'Distance = √(3^2 + 4^2) = √25 = 5.', marks: 1, difficulty: 'easy' },
    ],
  });

  await QuizAttempt.create({
    schoolId,
    quizId: mathQuiz._id,
    studentId: aaravStudent.user._id,
    studentName: aaravStudent.profile.name,
    rollNumber: aaravStudent.profile.rollNumber,
    classSectionId: class10A._id,
    startedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(Date.now() - 2700000),
    status: 'submitted',
    durationTakenSeconds: 540,
    answers: [
      { questionId: 'math_q1', studentAnswer: '0', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q2', studentAnswer: 'cos(θ)', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q3', studentAnswer: 'b^2 - 4ac = 0', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q4', studentAnswer: 'True', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q5', studentAnswer: 'False', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q6', studentAnswer: 'b^2 - 4ac', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q7', studentAnswer: 'sine', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q8', studentAnswer: '1', isCorrect: true, marksAwarded: 1, isFlaggedForReview: false },
      { questionId: 'math_q9', studentAnswer: '40', isCorrect: false, marksAwarded: 0, isFlaggedForReview: true },
      { questionId: 'math_q10', studentAnswer: '7', isCorrect: false, marksAwarded: 0, isFlaggedForReview: false },
    ],
    totalQuestions: 10,
    attemptedQuestions: 10,
    correctAnswers: 8,
    wrongAnswers: 2,
    skippedQuestions: 0,
    totalMarksObtained: 8,
    maxMarks: 10,
    percentage: 80,
    isPassed: true,
  });

  console.log('\n======================================================');
  console.log('       EDUHUB SMS DEMO SEED COMPLETED SUCCESSFULLY     ');
  console.log('       Institution: Adiya School of Excellence (ADIYA) ');
  console.log('======================================================');
  console.log('SCHOOL STRUCTURE:');
  console.log('- Classes: Class 1 through Class 10 (20 sections: A & B)');
  console.log('- Total Students: 100 demo students (5 per section)');
  console.log('- Total Teachers: 25 qualified faculty members');
  console.log('- Total Central Subjects: 12 reusable core subjects');
  console.log('DEMO LOGIN CREDENTIALS:');
  console.log('1. Admin:   admin@adiya.edu          / Admin@123');
  console.log('2. Teacher: rajesh.sharma@adiya.edu  / Teacher@123 (Class Teacher 10-A)');
  console.log('3. Teacher: priya.nair@adiya.edu     / Teacher@123 (Class Teacher 9-B, Elevated)');
  console.log('4. Student: aarav.sharma@adiya.edu   / Student@123 (Class 10-A, Roll 1)');
  console.log('5. Student: ananya.sharma@adiya.edu  / Student@123 (Class 9-B, Roll 1)');
  console.log('6. Parent:  sunita.sharma@adiya.edu  / Parent@123  (Linked to Aarav 10-A & Vihaan 5-B)');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[EduHub Seed] Error occurred during seeding:', err);
  process.exit(1);
});
