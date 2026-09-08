import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolClass,
  AcademicYear,
  Term,
  Student,
  Billing,
  BillingBreakdownItem,
  AuditLog,
  UserAccount,
  UserRole,
  SchoolSection
} from '../types';
import {
  Users,
  Briefcase,
  Layers,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  UserPlus,
  Receipt,
  FileCheck,
  Trash2,
  RefreshCw,
  UserCheck,
  Edit2,
  X,
  Lock,
  User,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  UserX,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Pencil
} from 'lucide-react';

interface AdminPanelProps {
  classes: SchoolClass[];
  years: AcademicYear[];
  terms: Term[];
  students: Student[];
  billings: Billing[];
  breakdowns: BillingBreakdownItem[];
  logs: AuditLog[];
  activeTermId: number;
  onAddStudent: (student: Omit<Student, 'student_id'>) => void;
  onAddClass: (className: string, section: SchoolSection) => void;
  onDeleteClass?: (classId: number) => void;
  onRollForward: (oldTermId: number, newTermId: number, defaultTuition: number) => void;
  onAddNewTerm: (termName: 'Term 1' | 'Term 2' | 'Term 3', yearId: number) => boolean;
  onSetActiveTerm: (termId: number) => void;
  formatCurrency: (amount: number) => string;
  onAddAcademicYear?: (yearLabel: string, status: 'Active' | 'Archived') => void;
  onSetYearActive?: (yearId: number) => void;
  onDeleteAcademicYear?: (yearId: number) => void;
  userAccounts: UserAccount[];
  onAddUser: (username: string, fullName: string, role: UserRole, passwordHash: string) => { success: boolean; message: string };
  onEditUser: (userId: number, username: string, fullName: string, role: UserRole, passwordHash?: string) => { success: boolean; message: string };
  onDeleteUser: (userId: number) => { success: boolean; message: string };
  onUpdateStudent?: (student: Student) => void;
  currentUser: UserAccount;
}

export default function AdminPanel({
  classes,
  years,
  terms,
  students,
  billings,
  breakdowns,
  logs,
  activeTermId,
  onAddStudent,
  onAddClass,
  onDeleteClass,
  onRollForward,
  onAddNewTerm,
  onSetActiveTerm,
  formatCurrency,
  onAddAcademicYear,
  onSetYearActive,
  onDeleteAcademicYear,
  userAccounts,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onUpdateStudent,
  currentUser
}: AdminPanelProps) {
  // Local state for forms
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [classId, setClassId] = useState(classes[0]?.class_id || 0);
  const [parentPhone, setParentPhone] = useState('');
  const [admNo, setAdmNo] = useState('');

  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState<SchoolSection>('Primary');
  const [rollOldTerm, setRollOldTerm] = useState(terms[0]?.term_id || 0);
  const [rollNewTerm, setRollNewTerm] = useState<number>(0);
  const [defaultTuition, setDefaultTuition] = useState(35000);

  const [newTermName, setNewTermName] = useState<'Term 1' | 'Term 2' | 'Term 3'>('Term 1');
  const [newTermYearId, setNewTermYearId] = useState(years[0]?.year_id || 0);

  const [newYearLabel, setNewYearLabel] = useState('');
  const [newYearStatus, setNewYearStatus] = useState<'Active' | 'Archived'>('Active');

  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Synchronize dropdown default selections when classes or years change
  useEffect(() => {
    if ((!classId || !classes.some(c => c.class_id === classId)) && classes.length > 0) {
      setClassId(classes[0].class_id);
    }
  }, [classes, classId]);

  useEffect(() => {
    if ((!newTermYearId || !years.some(y => y.year_id === newTermYearId)) && years.length > 0) {
      setNewTermYearId(years[0].year_id);
    }
  }, [years, newTermYearId]);

  // Student Roster search, filter, and edit card states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Male');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editAdmNo, setEditAdmNo] = useState('');
  const [editClassId, setEditClassId] = useState<number>(classes[0]?.class_id || 1);
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [studentEditAlert, setStudentEditAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeStudentsCount = useMemo(() => {
    return students.filter((s) => s.is_active !== false).length;
  }, [students]);

  const deactivatedStudentsCount = useMemo(() => {
    return students.filter((s) => s.is_active === false).length;
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Status filter
      if (studentStatusFilter === 'active' && s.is_active === false) return false;
      if (studentStatusFilter === 'deactivated' && s.is_active !== false) return false;

      // Class filter
      if (studentClassFilter !== 'all' && s.current_class_id !== Number(studentClassFilter)) {
        return false;
      }

      // Search query
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        const adm = s.admission_no.toLowerCase();
        const phone = (s.parent_phone || '').toLowerCase();
        const matchedClass = classes.find((c) => c.class_id === s.current_class_id);
        const className = (matchedClass?.class_name || '').toLowerCase();
        if (!fullName.includes(q) && !adm.includes(q) && !phone.includes(q) && !className.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [students, studentSearchQuery, studentClassFilter, studentStatusFilter, classes]);

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditFirstName(student.first_name);
    setEditLastName(student.last_name);
    setEditGender((student.gender as 'Male' | 'Female') || 'Male');
    setEditDateOfBirth(student.date_of_birth || '');
    setEditAdmNo(student.admission_no);
    setEditClassId(student.current_class_id);
    setEditParentPhone(student.parent_phone || '');
    setEditIsActive(student.is_active !== false);
    setStudentEditAlert(null);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editAdmNo.trim()) {
      setStudentEditAlert({ type: 'error', message: 'First name, last name, and admission number are required.' });
      return;
    }

    const conflict = students.some(
      (s) =>
        s.student_id !== editingStudent.student_id &&
        s.admission_no.trim().toLowerCase() === editAdmNo.trim().toLowerCase()
    );
    if (conflict) {
      setStudentEditAlert({
        type: 'error',
        message: `Admission number "${editAdmNo}" is already assigned to another student.`
      });
      return;
    }

    const updated: Student = {
      ...editingStudent,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      gender: editGender,
      date_of_birth: editDateOfBirth.trim(),
      admission_no: editAdmNo.trim(),
      current_class_id: Number(editClassId),
      parent_phone: editParentPhone.trim(),
      is_active: editIsActive
    };

    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    const statusTxt = updated.is_active ? 'Active' : 'Deactivated';
    triggerNotice(`Updated ${updated.first_name} ${updated.last_name} (Status: ${statusTxt})`);
    setEditingStudent(null);
  };

  // User Management tab and form states
  const [activeTab, setActiveTab] = useState<'operations' | 'users'>('operations');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [userFullName, setUserFullName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('Cashier');
  const [userPassword, setUserPassword] = useState('');
  const [userAlert, setUserAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to handle user creation/edit submission
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAlert(null);

    if (editingUser) {
      const res = onEditUser(
        editingUser.user_id,
        userUsername,
        userFullName,
        userRole,
        userPassword || undefined
      );
      if (res.success) {
        setUserAlert({ type: 'success', message: res.message });
        triggerNotice(res.message);
        setEditingUser(null);
        setUserFullName('');
        setUserUsername('');
        setUserRole('Cashier');
        setUserPassword('');
      } else {
        setUserAlert({ type: 'error', message: res.message });
      }
    } else {
      if (!userPassword) {
        setUserAlert({ type: 'error', message: 'Password is required when creating a new user account!' });
        return;
      }
      const res = onAddUser(userUsername, userFullName, userRole, userPassword);
      if (res.success) {
        setUserAlert({ type: 'success', message: res.message });
        triggerNotice(res.message);
        setUserFullName('');
        setUserUsername('');
        setUserRole('Cashier');
        setUserPassword('');
      } else {
        setUserAlert({ type: 'error', message: res.message });
      }
    }
  };

  const handleStartEditUser = (acc: UserAccount) => {
    setEditingUser(acc);
    setUserFullName(acc.full_name);
    setUserUsername(acc.username);
    setUserRole(acc.role);
    setUserPassword('');
    setUserAlert(null);
  };

  const handleCancelEditUser = () => {
    setEditingUser(null);
    setUserFullName('');
    setUserUsername('');
    setUserRole('Cashier');
    setUserPassword('');
    setUserAlert(null);
  };

  const handleDeleteUser = (user: UserAccount) => {
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    const res = onDeleteUser(userToDelete.user_id);
    if (res.success) {
      setUserAlert({ type: 'success', message: res.message });
      triggerNotice(res.message);
      if (editingUser && editingUser.user_id === userToDelete.user_id) {
        handleCancelEditUser();
      }
    } else {
      setUserAlert({ type: 'error', message: res.message });
    }
    setUserToDelete(null);
  };

  const activeTerm = terms.find((t) => t.term_id === activeTermId);
  const activeYear = activeTerm ? years.find((y) => y.year_id === activeTerm.year_id) : null;

  // Auto-generate admission number if empty or reset (format: ASA/current_year/0001)
  const currentCalendarYear = new Date().getFullYear().toString();
  const currentYear = activeYear ? activeYear.year_label.split('/')[0].trim() : currentCalendarYear;

  React.useEffect(() => {
    if (!admNo) {
      const prefix = `ASA/${currentYear}/`;
      const matchingStudents = students.filter(s =>
        s.admission_no.toLowerCase().startsWith(prefix.toLowerCase())
      );
      let maxSeq = 0;
      if (matchingStudents.length > 0) {
        matchingStudents.forEach(s => {
          const parts = s.admission_no.split('/');
          if (parts.length >= 3) {
            const seq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        });
      }
      const nextNo = `ASA/${currentYear}/${String(maxSeq + 1).padStart(4, '0')}`;
      setAdmNo(nextNo);
    }
  }, [students, activeYear, admNo, currentYear]);

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearLabel.trim()) return;
    if (onAddAcademicYear) {
      onAddAcademicYear(newYearLabel.trim(), newYearStatus);
      setNewYearLabel('');
      triggerNotice('Registered academic session checkpoint: ' + newYearLabel);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !parentPhone || !admNo) return;
    if (classes.length === 0 || !classId || classId === 0) {
      triggerNotice('Please add and select a class group before creating a student.');
      return;
    }

    onAddStudent({
      admission_no: admNo,
      first_name: firstName,
      last_name: lastName,
      gender: gender,
      date_of_birth: dateOfBirth,
      current_class_id: Number(classId),
      parent_phone: parentPhone
    });

    setFirstName('');
    setLastName('');
    setGender('Male');
    setDateOfBirth('');
    setParentPhone('');
    setAdmNo('');
    triggerNotice('Successfully registered student ' + firstName + ' ' + lastName);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName.trim(), newClassSection);
    setNewClassName('');
    triggerNotice(`New school classroom added: ${newClassName} inside section: ${newClassSection}`);
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (years.length === 0 || !newTermYearId || newTermYearId === 0) {
      triggerNotice('Please register an academic session first before creating a term.');
      return;
    }
    if (onAddNewTerm(newTermName, Number(newTermYearId))) {
      triggerNotice(`Added ${newTermName} for selected academic cycle.`);
    }
  };

  const handleExecuteRollForward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollOldTerm || !rollNewTerm) {
      alert('Please configure both source term and the target term.');
      return;
    }
    if (Number(rollOldTerm) === Number(rollNewTerm)) {
      alert('Source and target terms cannot be identical.');
      return;
    }

    onRollForward(Number(rollOldTerm), Number(rollNewTerm), Number(defaultTuition));
    triggerNotice('Executed multi-term balance roll-forward with dynamic statements injection!');
  };

  const triggerNotice = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {showNotification && (
        <div id="admin-toast-banner" className="bg-teal-600 text-white font-sans text-sm font-semibold px-4 py-3.5 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
          <FileCheck className="h-5 w-5" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* Segmented Tab Controller */}
      <div className="bg-slate-200/60 p-1 rounded-xl max-w-sm flex gap-1 border border-slate-300/10">
        <button
          onClick={() => {
            setActiveTab('operations');
            setUserAlert(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono transition-all duration-150 ${
            activeTab === 'operations'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Operations
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            setUserAlert(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Workstation Roles
        </button>
      </div>

      {activeTab === 'operations' && (
        <>
          {/* Overview Headings */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                <h3 className="font-bold text-slate-800 text-sm font-display tracking-tight uppercase">Active Operational Cycle</h3>
              </div>
              <span className="bg-teal-50 text-teal-800 text-xs px-3 py-1 rounded-full font-bold border border-teal-200/50">
                {activeYear && activeTerm ? `${activeYear.year_label} - ${activeTerm.term_name}` : 'No Session / Term Configured'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">Total Students</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-display text-slate-900">{activeStudentsCount}</span>
                  {deactivatedStudentsCount > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      ({deactivatedStudentsCount} deactivated)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">Total Classrooms</span>
                <span className="text-2xl font-bold font-display text-slate-900 block mt-1">{classes.length}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">System Cycles</span>
                <span className="text-2xl font-bold font-display text-slate-900 block mt-1">{years.length}</span>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
              <span className="text-xs text-slate-500 font-medium shrink-0">Set active system term for LAN dashboard:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full flex-nowrap shrink scrollbar-thin">
                {terms.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No academic terms registered yet.</span>
                ) : (
                  terms.map((t) => {
                    const termY = years.find((y) => y.year_id === t.year_id);
                    const isActive = activeTermId === t.term_id;
                    return (
                      <button
                        key={t.term_id}
                        id={`btn-set-active-term-${t.term_id}`}
                        onClick={() => onSetActiveTerm(t.term_id)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t.term_name} ({termY?.year_label || 'Unassigned'})
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Admin configurations */}
        <div className="space-y-6 lg:col-span-1">
          {/* Section 1: Register Student */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2 font-display">
              <UserPlus className="h-4.5 w-4.5 text-teal-600" />
              Register New Student
            </h3>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Admission No</label>
                  <span className="text-[9px] text-teal-650 bg-teal-50 border border-teal-200/50 rounded px-1.5 py-0.5 font-bold font-mono">
                    Auto-Generated
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`ASA/${currentYear}/0001`}
                    value={admNo}
                    onChange={(e) => setAdmNo(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pr-10 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-700 font-semibold font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAdmNo(''); // This will clear the input and trigger our useEffect to auto-calculate
                    }}
                    title="Reset to next sequential auto-generated ID"
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">First Name</label>
                  <input
                    type="text"
                    placeholder="Musa"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Last Name</label>
                  <input
                    type="text"
                    placeholder="Dan-juma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Assigned Academic Class</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-semibold"
                >
                  {classes.length === 0 ? (
                    <option value={0}>-- Add a classroom group below first --</option>
                  ) : (
                    classes.map((cls) => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name} ({cls.section})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Parent Phone Number</label>
                <input
                  type="text"
                  placeholder="08031122334"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium font-mono"
                  required
                />
              </div>

              <button
                id="btn-admin-submit-student"
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150"
              >
                <Plus className="h-4 w-4" /> Create Student Ledger
              </button>
            </form>
          </div>

          {/* Section 2: Manage School Classrooms */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2 font-display">
              <Layers className="h-4.5 w-4.5 text-teal-600" />
              Add Class Group
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 opacity-80 uppercase tracking-widest block mb-1 font-mono">Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. SS 3 Science Beta"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-850 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 opacity-80 uppercase tracking-widest block mb-1 font-mono">Assigned Section</label>
                <select
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value as SchoolSection)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="Pre-Primary">Pre-Primary Section</option>
                  <option value="Primary">Primary Section</option>
                  <option value="JSS">JSS (Junior Secondary) Section</option>
                  <option value="SSS">SSS (Senior Secondary) Section</option>
                </select>
              </div>

              <button
                id="btn-admin-add-class"
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all duration-155 cursor-pointer"
              >
                Create Classroom Group
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2 mt-3">
              <span className="text-[9px] font-bold text-slate-400 opacity-85 uppercase tracking-widest block font-mono">
                Registered Classes ({classes.length})
              </span>
              <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-150 border border-slate-150 rounded-lg bg-slate-50/20">
                {classes.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs italic">
                    No classes registered yet.
                  </div>
                ) : (
                  classes.map((cls) => {
                    const studentCount = students.filter((s) => s.current_class_id === cls.class_id).length;
                    return (
                      <div key={cls.class_id} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                        <div>
                          <span className="font-bold text-slate-900 block font-sans">{cls.class_name}</span>
                          <span className="text-[9px] text-slate-500 font-mono inline-block">
                            {cls.section} · {studentCount} student{studentCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        {onDeleteClass && (
                          <button
                            type="button"
                            onClick={() => onDeleteClass(cls.class_id)}
                            className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/60 p-1 rounded transition border border-rose-100 cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Section 2.5: Manage Academic Sessions (Years) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-display">
              <Calendar className="h-4.5 w-4.5 text-teal-600" />
              Register Academic Session
            </h3>
            
            <form onSubmit={handleCreateYear} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 opacity-80 uppercase tracking-widest block mb-1 font-mono">Academic Session Label</label>
                <input
                  type="text"
                  placeholder="e.g. 2027/2028"
                  value={newYearLabel}
                  onChange={(e) => setNewYearLabel(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-850 font-medium font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 opacity-80 uppercase tracking-widest block mb-1 font-mono">Session Year State</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewYearStatus('Active')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold border transition ${
                      newYearStatus === 'Active'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-105 hover:bg-slate-100'
                    }`}
                  >
                    Active Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewYearStatus('Archived')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold border transition ${
                      newYearStatus === 'Archived'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-105 hover:bg-slate-100'
                    }`}
                  >
                    Archived
                  </button>
                </div>
              </div>

              <button
                id="btn-admin-add-year"
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all h-[34px]"
              >
                Create Academic Session
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 opacity-85 uppercase tracking-widest block font-mono">Registered Sessions List</span>
              <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-150 border border-slate-150 rounded-lg bg-slate-50/20">
                {years.map((y) => (
                  <div key={y.year_id} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div>
                      <span className="font-bold text-slate-900 block font-sans">{y.year_label}</span>
                      <span className="text-[9px] font-bold font-mono mt-0.5 inline-block">
                        {y.status === 'Active' ? (
                          <span className="text-teal-700 bg-teal-50 border border-teal-155 px-1.5 py-0.5 rounded uppercase text-[8px] font-extrabold">Active</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase text-[8px]">Archived</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {y.status !== 'Active' && (
                        <button
                          type="button"
                          onClick={() => onSetYearActive && onSetYearActive(y.year_id)}
                          className="bg-white hover:bg-teal-50 text-teal-600 border border-slate-200 hover:border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded transition"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteAcademicYear && onDeleteAcademicYear(y.year_id)}
                        className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/60 p-1 rounded transition border border-rose-100"
                        title="Delete session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Columns: List of students & Multi-term Roll Forward */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 3: Roll-Forward Implementation Panel */}
          <div className="bg-white border-l-4 border-l-teal-500 border-y border-r border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display uppercase tracking-tight">Multi-Term Balance Roll-Forward Tool</h3>
                <p className="text-xs text-slate-400 mt-1">Locks outstanding debts of the prior term and posts them as dynamic debt balances in the new statement.</p>
              </div>
            </div>

            <form onSubmit={handleExecuteRollForward} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5 md:col-span-2">
                <div className="p-3 bg-amber-50/50 border border-amber-200 text-amber-800 text-[11px] rounded-lg leading-relaxed">
                  <strong>Important Business Rules Check:</strong> Executing batch roll-forward will automatically compute the exact <code className="font-mono px-1 bg-white/70 border border-amber-205 rounded">total_amount_due + prior_debt_accumulated - amount_paid</code> for <strong>ALL</strong> students in the <strong>Source Term</strong>. A new billing invoice will be initialized for each student in the <strong>Target Term</strong>, pre-populated with their outstanding balance embedded into the <code className="font-mono">prior_debt_accumulated</code> field.
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 font-mono">Source Term (Old Term)</label>
                <select
                  value={rollOldTerm}
                  onChange={(e) => setRollOldTerm(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700 font-bold focus:outline-teal-555"
                >
                  <option value={0}>-- Select Prior Term --</option>
                  {terms.map((t) => {
                    const y = years.find((y) => y.year_id === t.year_id);
                    return (
                      <option key={t.term_id} value={t.term_id}>
                        {t.term_name} ({y?.year_label})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 font-mono">Target Term (New Term)</label>
                <select
                  value={rollNewTerm}
                  onChange={(e) => setRollNewTerm(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700 font-bold focus:outline-teal-555"
                >
                  <option value={0}>-- Select target/create term --</option>
                  {terms.map((t) => {
                    const y = years.find((y) => y.year_id === t.year_id);
                    return (
                      <option key={t.term_id} value={t.term_id}>
                        {t.term_name} ({y?.year_label})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 text-[10px] leading-relaxed font-mono">
                💡 Note: Tuition fees are automatically allocated per student based on their classroom's section defaults (Pre-Primary, Primary, JSS, SSS) configured in System Settings.
              </div>

              <div className="flex items-end">
                <button
                  id="btn-execute-forward-processor"
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition h-[38px] uppercase tracking-wider"
                >
                  <Calendar className="h-4 w-4" /> Run Roll-Forward
                </button>
              </div>
            </form>

            {/* Create new system term card */}
            <form onSubmit={handleCreateTerm} className="border-t border-slate-150 pt-4 mt-4 space-y-3">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase block font-mono">Create New System Term</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Select Session</label>
                  <select
                    value={newTermYearId}
                    onChange={(e) => setNewTermYearId(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700 font-bold focus:outline-teal-500"
                  >
                    {years.length === 0 ? (
                      <option value={0}>-- Register an academic session first --</option>
                    ) : (
                      years.map((y) => (
                        <option key={y.year_id} value={y.year_id}>
                          {y.year_label} {y.status === 'Active' ? '(Active)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">Select Term</label>
                  <select
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700 font-bold focus:outline-teal-500"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
              <button
                id="btn-admin-submit-term"
                type="submit"
                className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 py-2 rounded-lg text-[10px] font-extrabold transition flex items-center justify-center gap-1.5 uppercase tracking-wider h-[36px]"
              >
                <Plus className="h-4 w-4" /> Register & Activate Term on Selected Session
              </button>
            </form>
          </div>

          {/* Section 4: Student Roster Ledger table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm font-display uppercase tracking-tight">
                  Active Student Ledgers
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200/80 px-2.5 py-1 rounded-full font-extrabold uppercase">
                  Active Students: {activeStudentsCount}
                </span>
                {deactivatedStudentsCount > 0 && (
                  <span className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-full font-extrabold uppercase">
                    {deactivatedStudentsCount} Deactivated
                  </span>
                )}
              </div>
            </div>

            {/* Search and Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="input-student-search"
                  type="text"
                  placeholder="Search by name, admission number, or parent phone..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-8 py-2 bg-slate-50 focus:bg-white focus:outline-teal-500 font-medium text-slate-800 transition"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  id="select-student-class-filter"
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg py-2 px-3 bg-slate-50 focus:bg-white focus:outline-teal-500 font-medium text-slate-700 transition cursor-pointer"
                >
                  <option value="all">All Classrooms ({classes.length})</option>
                  {classes.map((c) => {
                    const classActiveCount = students.filter(
                      (s) => s.current_class_id === c.class_id && s.is_active !== false
                    ).length;
                    return (
                      <option key={c.class_id} value={c.class_id}>
                        {c.class_name} ({c.section}) - {classActiveCount} active
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setStudentStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    studentStatusFilter === 'active'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({activeStudentsCount})
                </button>
                {deactivatedStudentsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter('deactivated')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      studentStatusFilter === 'deactivated'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Deactivated ({deactivatedStudentsCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStudentStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    studentStatusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({students.length})
                </button>
              </div>
            </div>

            {/* Results count label if filtered */}
            {(studentSearchQuery.trim() || studentClassFilter !== 'all' || studentStatusFilter !== 'all') && (
              <div className="px-5 py-2 bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of {students.length} students
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearchQuery('');
                    setStudentClassFilter('all');
                    setStudentStatusFilter('all');
                  }}
                  className="text-teal-600 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-150 text-[10px] tracking-wider uppercase font-bold font-mono">
                    <th className="p-4">Admission No</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Date of Birth</th>
                    <th className="p-4">Classroom</th>
                    <th className="p-4">Term Statement Status</th>
                    <th className="p-4">Parent Contact</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold text-slate-600 text-xs">No students found</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          No student records match the search query or class filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentSearchQuery('');
                            setStudentClassFilter('all');
                            setStudentStatusFilter('all');
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const matchedClass = classes.find((c) => c.class_id === student.current_class_id);
                      const matchedBilling = billings.find(
                        (b) => b.student_id === student.student_id && b.term_id === activeTermId
                      );

                      let statusBadge = (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          No Statement
                        </span>
                      );

                      if (matchedBilling) {
                        const totalDue = matchedBilling.total_amount_due + matchedBilling.prior_debt_accumulated;
                        const hasPaid = matchedBilling.amount_paid;
                        if (matchedBilling.payment_status === 'Paid') {
                          statusBadge = (
                            <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Paid fully
                            </span>
                          );
                        } else if (matchedBilling.payment_status === 'Partially Paid') {
                          statusBadge = (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Partial (₦{hasPaid})
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Unpaid (₦{totalDue})
                            </span>
                          );
                        }
                      }

                      const isActive = student.is_active !== false;

                      return (
                        <tr
                          key={student.student_id}
                          className={`hover:bg-slate-50/70 transition duration-150 ${
                            !isActive ? 'bg-slate-50/40 opacity-75' : ''
                          }`}
                        >
                          <td className="p-4 font-mono font-medium text-slate-800">{student.admission_no}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(student)}
                              className="text-left font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1.5 cursor-pointer group transition"
                              title="Click to edit student info or change activation status"
                            >
                              <span className={!isActive ? 'line-through text-slate-500' : ''}>
                                {student.first_name} {student.last_name}
                              </span>
                              <Pencil className="h-3 w-3 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                          </td>
                          <td className="p-4 text-slate-700">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              student.gender === 'Female' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {student.gender || 'Male'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-mono text-[11px]">
                            {student.date_of_birth || '—'}
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {matchedClass ? matchedClass.class_name : 'N/A'}
                          </td>
                          <td className="p-4">{statusBadge}</td>
                          <td className="p-4 text-slate-600 font-mono font-semibold">
                            {student.parent_phone || '—'}
                          </td>
                          <td className="p-4 text-right">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Deactivated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'users' && (
        <div id="users-management-panel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Box: Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-1 h-fit">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                  <h3 className="font-bold text-slate-800 text-sm font-display tracking-tight uppercase">
                    {editingUser ? 'Edit User Credentials' : 'Register User Node'}
                  </h3>
                </div>
                {editingUser && (
                  <button
                    onClick={handleCancelEditUser}
                    className="text-slate-400 hover:text-rose-600 hover:bg-slate-50 p-1.5 rounded-md transition"
                    title="Cancel Edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {userAlert && (
                <div
                  className={`p-3.5 mb-4 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    userAlert.type === 'success'
                      ? 'bg-teal-50 border border-teal-200 text-teal-800 font-sans'
                      : 'bg-rose-50 border border-rose-200 text-rose-800 font-sans'
                  }`}
                >
                  {userAlert.type === 'success' ? (
                    <FileCheck className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  )}
                  <span>{userAlert.message}</span>
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Aisha Danbaffa"
                      value={userFullName}
                      onChange={(e) => setUserFullName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-9 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-medium"
                      required
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                    Username (Login ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. aisha"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      disabled={editingUser && editingUser.username === 'admin'}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-9 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-semibold font-mono disabled:opacity-60"
                      required
                    />
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                    System Authority Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    disabled={editingUser && editingUser.user_id === currentUser.user_id}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-semibold disabled:opacity-60"
                  >
                    <option value="Admin">Admin (Executive Authority)</option>
                    <option value="Cashier">Cashier (Filing & Billing)</option>
                    <option value="Inventory Manager">Inventory Manager (Logistics)</option>
                  </select>
                  {editingUser && editingUser.user_id === currentUser.user_id && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1 font-mono">
                      * Role changes disabled for active admin session account safety.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Security Password
                    </label>
                    {editingUser && (
                      <span className="text-[8px] text-slate-400 font-mono">
                        Leave blank to keep old password
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder={editingUser ? "••••••••" : "Specify workstation password"}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-9 bg-slate-50 focus:bg-white focus:outline-teal-500 text-slate-800 font-mono"
                      required={!editingUser}
                    />
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {editingUser && (
                    <button
                      type="button"
                      onClick={handleCancelEditUser}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {editingUser ? (
                      <>
                        <FileCheck className="h-4 w-4" /> Save Access Nodes
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" /> Create Workstation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Box: Roster */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-display uppercase tracking-tight">
                  <Users className="h-4.5 w-4.5 text-teal-600" />
                  Active System Operator Registry
                </h3>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-extrabold uppercase">
                  Operators: {userAccounts.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                {userAccounts.map((acc) => {
                  const isActiveSession = currentUser.user_id === acc.user_id;
                  const isBeingEdited = editingUser && editingUser.user_id === acc.user_id;

                  const initials = acc.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  let roleBadge = (
                    <span className="bg-slate-100 text-slate-650 border border-slate-200 text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">
                      {acc.role}
                    </span>
                  );
                  if (acc.role === 'Admin') {
                    roleBadge = (
                      <span className="bg-teal-55/40 text-teal-700 border border-teal-200 text-[9px] px-2 py-0.5 rounded-md font-mono font-extrabold flex items-center gap-1">
                        <Shield className="h-3 w-3 text-teal-605" /> Admin Node
                      </span>
                    );
                  } else if (acc.role === 'Cashier') {
                    roleBadge = (
                      <span className="bg-amber-55/40 text-amber-700 border border-amber-200 text-[9px] px-2 py-0.5 rounded-md font-mono font-extrabold flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-amber-605" /> Cashier Staff
                      </span>
                    );
                  } else if (acc.role === 'Inventory Manager') {
                    roleBadge = (
                      <span className="bg-blue-55/40 text-blue-700 border border-blue-200 text-[9px] px-2 py-0.5 rounded-md font-mono font-extrabold flex items-center gap-1">
                        <Layers className="h-3 w-3 text-blue-605" /> Inventory Manager
                      </span>
                    );
                  }

                  return (
                    <div
                      key={acc.user_id}
                      className={`p-4 border rounded-xl flex items-start gap-3 transition-all duration-150 relative ${
                        isBeingEdited
                          ? 'border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-500/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50/40 hover:shadow-xs'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-900 text-teal-400 font-display font-black text-xs flex items-center justify-center tracking-tight border border-slate-800 shadow-inner">
                        {initials}
                      </div>

                      <div className="flex-grow space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs truncate leading-none">
                            {acc.full_name}
                          </h4>
                          {isActiveSession && (
                            <span className="text-[8px] font-extrabold uppercase bg-teal-500 text-white font-mono rounded px-1.5 py-0.5">
                              You
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono font-semibold">
                          @{acc.username}
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          {roleBadge}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditUser(acc)}
                              className="text-slate-500 hover:text-teal-650 p-1.5 rounded-md hover:bg-slate-105 transition"
                              title="Modify account"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {!isActiveSession ? (
                              <button
                                type="button"
                                id={`btn-delete-user-${acc.user_id}`}
                                onClick={() => handleDeleteUser(acc)}
                                className="text-rose-500 hover:text-rose-750 p-1.5 rounded-md hover:bg-rose-50 hover:border hover:border-rose-100 transition cursor-pointer"
                                title="Remove account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 opacity-30 select-none text-slate-300"
                                title="Active session operator cannot be purged"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Information Card Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-sm tracking-tight">Edit Student Information</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Admission: {editingStudent.admission_no} • ID: #{editingStudent.student_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition hover:bg-slate-800 cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Activation / Deactivation Status Banner */}
              <div
                className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editIsActive
                    ? 'bg-teal-50/80 border-teal-200 text-teal-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {editIsActive ? (
                    <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  ) : (
                    <UserX className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-display uppercase tracking-wide">
                        {editIsActive ? 'Active Student' : 'Deactivated Student'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono ${
                          editIsActive
                            ? 'bg-teal-100 text-teal-800 border border-teal-300/50'
                            : 'bg-rose-100 text-rose-800 border border-rose-300/50'
                        }`}
                      >
                        {editIsActive ? 'Counted & Searchable' : 'Hidden from Cashier'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {editIsActive
                        ? 'Student is counted in enrolment totals and visible in Cashier search and billings.'
                        : 'Student is excluded from student counts and hidden from Cashier workstation search.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-toggle-student-status"
                  onClick={() => setEditIsActive((prev) => !prev)}
                  className={`shrink-0 px-3 py-2 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                    editIsActive
                      ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-300 hover:border-rose-400 shadow-xs'
                      : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-xs'
                  }`}
                >
                  {editIsActive ? (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Activate
                    </>
                  )}
                </button>
              </div>

              {studentEditAlert && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    studentEditAlert.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{studentEditAlert.message}</span>
                </div>
              )}

              {/* Student Name Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-edit-student-firstname"
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-edit-student-lastname"
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    Gender
                  </label>
                  <select
                    id="select-edit-student-gender"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as 'Male' | 'Female')}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    Date of Birth
                  </label>
                  <input
                    id="input-edit-student-dob"
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Admission Number */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                  Admission Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-edit-student-admno"
                  type="text"
                  value={editAdmNo}
                  onChange={(e) => setEditAdmNo(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-mono font-bold text-slate-800"
                  required
                />
              </div>

              {/* Classroom */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                  Assigned Classroom
                </label>
                <select
                  id="select-edit-student-class"
                  value={editClassId}
                  onChange={(e) => setEditClassId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-medium text-slate-800 cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} ({cls.section})
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Contact Phone */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                  Parent / Guardian Contact Phone
                </label>
                <input
                  id="input-edit-student-phone"
                  type="text"
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                  placeholder="e.g. 08031234567"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-teal-500 font-mono font-medium text-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-student-edit"
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save Student Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50 border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm font-display">Delete User Account?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{userToDelete.full_name}</strong> (@{userToDelete.username}) from the system user registry? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-user"
                onClick={handleConfirmDeleteUser}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
