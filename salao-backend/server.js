// server.js - Servidor Salão Flávia (VERSÃO COMPLETA COM TODAS AS FUNCIONALIDADES)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// FUNÇÃO PARA PEGAR O IP DA MÁQUINA
// ==========================================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONEXÃO COM MONGODB
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://dev:dev123@cluster0.oflxvxo.mongodb.net/flavia_salao?retryWrites=true&w=majority&appName=Cluster0';

let dbConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    console.log('✅ Conectado ao MongoDB Atlas - Banco: Flavia Salão');
    console.log(`📦 Host: ${mongoose.connection.host}`);
  } catch (error) {
    dbConnected = false;
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
  }
}

connectDB();

// ==========================================
// SCHEMAS E MODELS (ATUALIZADOS)
// ==========================================

// ✅ Appointment com campos para pacotes recorrentes
const AppointmentSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    procedure: { type: String, required: true },
    professional: { type: String, default: 'Flávia' },
    price: { type: Number, required: true, default: 0 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationMinutes: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ['Agendado', 'Em Atendimento', 'Concluído', 'Cancelado'],
      default: 'Agendado',
    },
    paymentMethod: {
      type: String,
      enum: ['Pendente', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'],
      default: 'Pendente',
    },
    notes: { type: String, default: '' },
    source: { type: String, default: 'Toque da Beleza App' },
    // ✅ Novos campos para pacotes recorrentes
    isRecurringPackage: { type: Boolean, default: false },
    packageName: { type: String, default: '' },
    packageDurationMonths: { type: Number, default: 3 },
    packageSessionsTotal: { type: Number, default: 4 },
    packageSessionNumber: { type: Number, default: 1 },
    recurringGroupId: { type: String, default: '' },
    recurringFrequency: { type: String, default: '' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: 'Cabelo' },
    defaultPrice: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, default: 60, min: 15 },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProfessionalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'Cabeleireira Especialista' },
    phone: { type: String, default: '' },
    color: { type: String, default: '#ec4899' },
    avatar: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ NOVO: Schema para Pacotes Recorrentes
const RecurringPackageSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, default: '', trim: true },
    packageName: { type: String, required: true, trim: true },
    durationMonths: { type: Number, default: 3 },
    totalSessions: { type: Number, default: 4 },
    usedSessions: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'Pix' },
    professional: { type: String, default: 'Flávia' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Ativo' },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Professional = mongoose.model('Professional', ProfessionalSchema);
const RecurringPackage = mongoose.model('RecurringPackage', RecurringPackageSchema);

// ==========================================
// SEED DE DADOS INICIAIS (ATUALIZADO)
// ==========================================
async function seedDefaultDataIfEmpty() {
  try {
    // Profissionais
    const profCount = await Professional.countDocuments();
    if (profCount === 0) {
      await Professional.insertMany([
        { name: 'Flávia', role: 'Cabeleireira Master & Visagista', phone: '(11) 98765-4321', color: '#ec4899' },
        { name: 'Mariana', role: 'Colorista & Mega Hair', phone: '(11) 97654-3210', color: '#8b5cf6' },
        { name: 'Camila', role: 'Terapeuta Capilar & Escovista', phone: '(11) 96543-2109', color: '#06b6d4' },
      ]);
      console.log('🌱 Profissionais padrão inseridas no MongoDB!');
    }

    // Serviços
    const srvCount = await Service.countDocuments();
    if (srvCount === 0) {
      await Service.insertMany([
        { name: 'Progressiva Orgânica sem Formol', category: 'Química', defaultPrice: 280, durationMinutes: 150, description: 'Alisamento 100% livre de formol com brilho espelhado.' },
        { name: 'Corte Feminino & Finalização', category: 'Corte', defaultPrice: 120, durationMinutes: 60, description: 'Corte visagista personalizado com lavagem especial.' },
        { name: 'Botox Capilar / Alinhamento', category: 'Química', defaultPrice: 220, durationMinutes: 120, description: 'Redução de volume e frizz com reposição de massa capilar.' },
        { name: 'Hidratação Profunda / Nutrição', category: 'Tratamento', defaultPrice: 140, durationMinutes: 60, description: 'Tratamento intensivo com máscara e ampolas.' },
        { name: 'Cronograma Capilar (4 Sessões)', category: 'Tratamento', defaultPrice: 380, durationMinutes: 75, description: 'Ciclo completo de Hidratação, Nutrição e Reconstrução.' },
        { name: 'Mechas / Luzes & Tonalização', category: 'Coloração', defaultPrice: 380, durationMinutes: 180, description: 'Técnica de iluminação personalizada com proteção Plex.' },
        { name: 'Coloração / Retoque de Raiz', category: 'Coloração', defaultPrice: 160, durationMinutes: 90, description: 'Aplicação de tintura profissional com tratamento pós-química.' },
        { name: 'Escova Modelada & Tratamento', category: 'Finalização', defaultPrice: 85, durationMinutes: 45, description: 'Lavagem com massagem capilar e escova de alta fixação.' },
      ]);
      console.log('🌱 Serviços padrão inseridos no MongoDB!');
    }

    // Agendamentos de exemplo
    const apptCount = await Appointment.countDocuments();
    if (apptCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      await Appointment.insertMany([
        {
          clientName: 'Ana Beatriz Souza',
          clientPhone: '(11) 98765-1122',
          procedure: 'Corte Feminino & Finalização',
          professional: 'Flávia',
          price: 120,
          date: today,
          time: '09:00',
          durationMinutes: 60,
          status: 'Concluído',
          paymentMethod: 'Pix',
          notes: 'Franja cortada no estilo cortininha.',
          source: 'Toque da Beleza App',
          isRecurringPackage: false,
          packageName: '',
          packageDurationMonths: 3,
          packageSessionsTotal: 4,
          packageSessionNumber: 1,
          completedAt: new Date(),
        },
        {
          clientName: 'Juliana Mendes',
          clientPhone: '(11) 99123-4567',
          procedure: 'Mechas / Luzes & Tonalização',
          professional: 'Flávia',
          price: 380,
          date: today,
          time: '10:30',
          durationMinutes: 180,
          status: 'Em Atendimento',
          paymentMethod: 'Pendente',
          notes: 'Loiro perolado com raiz esfumada.',
          source: 'Toque da Beleza App',
          isRecurringPackage: false,
          packageName: '',
          packageDurationMonths: 3,
          packageSessionsTotal: 4,
          packageSessionNumber: 1,
        },
        {
          clientName: 'Camila Vasconcelos',
          clientPhone: '(11) 98888-4444',
          procedure: 'Botox Capilar / Alinhamento',
          professional: 'Mariana',
          price: 220,
          date: today,
          time: '14:00',
          durationMinutes: 120,
          status: 'Agendado',
          paymentMethod: 'Cartão de Crédito',
          notes: 'Cabelo fino, usar temperatura moderada na prancha.',
          source: 'Toque da Beleza App',
          isRecurringPackage: false,
          packageName: '',
          packageDurationMonths: 3,
          packageSessionsTotal: 4,
          packageSessionNumber: 1,
        },
        {
          clientName: 'Patrícia Rocha',
          clientPhone: '(11) 97777-3333',
          procedure: 'Escova Modelada & Tratamento',
          professional: 'Camila',
          price: 85,
          date: today,
          time: '16:30',
          durationMinutes: 45,
          status: 'Agendado',
          paymentMethod: 'Pendente',
          notes: 'Evento à noite.',
          source: 'Toque da Beleza App',
          isRecurringPackage: false,
          packageName: '',
          packageDurationMonths: 3,
          packageSessionsTotal: 4,
          packageSessionNumber: 1,
        },
      ]);
      console.log('🌱 Agendamentos iniciais inseridos no MongoDB!');
    }
  } catch (err) {
    console.warn('⚠️ Aviso na checagem de dados iniciais:', err.message);
  }
}

mongoose.connection.once('open', () => {
  seedDefaultDataIfEmpty();
});

// ==========================================
// ROTA DE HISTÓRICO
// ==========================================
app.get('/api/appointments/history', async (req, res) => {
  try {
    const { startDate, endDate, professional, procedure, search, status } = req.query;
    const query = {};

    if (status && status !== 'Todos') query.status = status;
    if (startDate && endDate) {
      query.date = { $gte: String(startDate), $lte: String(endDate) };
    } else if (startDate) {
      query.date = { $gte: String(startDate) };
    } else if (endDate) {
      query.date = { $lte: String(endDate) };
    }
    if (professional && professional !== 'Todos') query.professional = professional;
    if (procedure && procedure !== 'Todos') query.procedure = procedure;
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { clientName: searchRegex },
        { clientPhone: searchRegex },
        { procedure: searchRegex },
        { notes: searchRegex },
      ];
    }

    const history = await Appointment.find(query).sort({ date: -1, time: -1 });
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTAS - APPOINTMENTS
// ==========================================

app.get('/api/appointments', async (req, res) => {
  try {
    const { date, status, professional, search, month, year } = req.query;
    const query = {};

    if (date) query.date = date;
    if (status && status !== 'Todos') {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    if (professional && professional !== 'Todos') query.professional = professional;
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { clientName: searchRegex },
        { clientPhone: searchRegex },
        { procedure: searchRegex },
      ];
    }
    if (month && year) {
      const padMonth = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${padMonth}` };
    }

    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json({ success: true, data: appointments, count: appointments.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ NOVA ROTA: Batch de agendamentos recorrentes
app.post('/api/appointments/batch', async (req, res) => {
  try {
    const { appointments: items, createPackage, packageData } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum agendamento fornecido no lote.',
      });
    }

    const docsToInsert = items.map((item) => ({
      clientName: item.clientName,
      clientPhone: item.clientPhone,
      procedure: item.procedure,
      professional: item.professional || 'Flávia',
      price: Number(item.price) || 0,
      date: item.date,
      time: item.time,
      durationMinutes: Number(item.durationMinutes) || 60,
      status: item.status || 'Agendado',
      paymentMethod: item.paymentMethod || 'Pendente',
      notes: item.notes || '',
      source: item.source || 'Toque da Beleza App',
      isRecurringPackage: item.isRecurringPackage !== undefined ? item.isRecurringPackage : true,
      packageName: item.packageName || '',
      packageDurationMonths: Number(item.packageDurationMonths) || 1,
      packageSessionsTotal: Number(item.packageSessionsTotal) || items.length,
      packageSessionNumber: Number(item.packageSessionNumber) || 1,
      recurringGroupId: item.recurringGroupId || '',
      recurringFrequency: item.recurringFrequency || '',
    }));

    const inserted = await Appointment.insertMany(docsToInsert);

    let createdPkg = null;
    if (createPackage && packageData) {
      const newPkg = new RecurringPackage({
        clientName: packageData.clientName,
        clientPhone: packageData.clientPhone || '',
        packageName: packageData.packageName || 'Pacote Recorrente',
        durationMonths: Number(packageData.durationMonths) || 1,
        totalSessions: Number(packageData.totalSessions) || items.length,
        usedSessions: 0,
        totalPrice: Number(packageData.totalPrice) || 0,
        paymentMethod: packageData.paymentMethod || 'Pix',
        professional: packageData.professional || 'Flávia',
        startDate: packageData.startDate || items[0]?.date,
        endDate: packageData.endDate || items[items.length - 1]?.date,
        notes: packageData.notes || '',
        status: 'Ativo',
      });
      createdPkg = await newPkg.save();
    }

    res.status(201).json({
      success: true,
      data: inserted,
      count: inserted.length,
      package: createdPkg,
      message: `${inserted.length} agendamentos foram criados com sucesso!`,
    });
  } catch (error) {
    console.error('❌ Erro no batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ NOVA ROTA: Buscar grupo recorrente
app.get('/api/appointments/recurring-group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const appts = await Appointment.find({ recurringGroupId: groupId }).sort({ date: 1, time: 1 });
    res.json({ success: true, data: appts, count: appts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ NOVA ROTA: Deletar grupo recorrente
app.delete('/api/appointments/recurring-group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await Appointment.deleteMany({ recurringGroupId: groupId });
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} agendamentos da série recorrente foram removidos.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      procedure,
      professional = 'Flávia',
      price,
      date,
      time,
      durationMinutes = 60,
      status = 'Agendado',
      paymentMethod = 'Pendente',
      notes = '',
      source = 'Toque da Beleza App',
      isRecurringPackage = false,
      packageName = '',
      packageDurationMonths = 3,
      packageSessionsTotal = 4,
      packageSessionNumber = 1,
      recurringGroupId = '',
      recurringFrequency = '',
    } = req.body;

    if (!clientName || !clientPhone || !procedure || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: clientName, clientPhone, procedure, date, time',
      });
    }

    const conflict = await Appointment.findOne({
      date,
      time,
      professional,
      status: { $in: ['Agendado', 'Em Atendimento'] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'Horário já ocupado para este profissional',
      });
    }

    const appointment = new Appointment({
      clientName,
      clientPhone,
      procedure,
      professional,
      price: Number(price) || 0,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 60,
      status,
      paymentMethod,
      notes,
      source,
      isRecurringPackage,
      packageName,
      packageDurationMonths,
      packageSessionsTotal,
      packageSessionNumber,
      recurringGroupId,
      recurringFrequency,
    });

    await appointment.save();
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.status === 'Concluído' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });
    }
    res.json({ success: true, message: 'Agendamento removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTA FINANCEIRA COMPLETA
// ==========================================
app.get('/api/appointments/financial', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const professional = req.query.professional;
    const granularity = req.query.granularity || 'month';
    const day = req.query.day ? parseInt(req.query.day) : undefined;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const baseQuery = {};
    if (professional && professional !== 'Todos') {
      baseQuery.professional = professional;
    }

    const allAppointments = await Appointment.find(baseQuery);
    const padMonth = String(month).padStart(2, '0');

    // Yearly
    const trackedYears = [2024, 2025, 2026, 2027];
    const yearlyMap = {};
    trackedYears.forEach(y => { yearlyMap[y] = { revenue: 0, count: 0 }; });

    allAppointments.forEach(a => {
      if (a.status === 'Concluído' && a.date) {
        const y = parseInt(a.date.split('-')[0]);
        if (yearlyMap[y]) {
          yearlyMap[y].revenue += Number(a.price) || 0;
          yearlyMap[y].count += 1;
        }
      }
    });

    const yearlyRevenue = trackedYears.map((y, idx) => {
      const prevRev = idx > 0 ? yearlyMap[trackedYears[idx - 1]].revenue : 0;
      const curRev = yearlyMap[y].revenue;
      const growth = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : 0;
      return {
        year: y,
        revenue: curRev,
        count: yearlyMap[y].count,
        growth: Math.round(growth * 10) / 10
      };
    });

    // Monthly
    const monthlyMap = {};
    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = { revenue: 0, count: 0 };
    }

    allAppointments.forEach(a => {
      if (a.status === 'Concluído' && a.date && a.date.startsWith(`${year}-`)) {
        const m = parseInt(a.date.split('-')[1]);
        if (monthlyMap[m]) {
          monthlyMap[m].revenue += Number(a.price) || 0;
          monthlyMap[m].count += 1;
        }
      }
    });

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month: m,
        monthName: monthNames[i],
        year,
        revenue: monthlyMap[m].revenue,
        count: monthlyMap[m].count
      };
    });

    // Daily
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { revenue: 0, count: 0 };
    }

    allAppointments.forEach(a => {
      if (a.status === 'Concluído' && a.date && a.date.startsWith(`${year}-${padMonth}-`)) {
        const d = parseInt(a.date.split('-')[2]);
        if (dailyMap[d]) {
          dailyMap[d].revenue += Number(a.price) || 0;
          dailyMap[d].count += 1;
        }
      }
    });

    const dailyRevenue = Object.keys(dailyMap).map(d => {
      const dayNum = parseInt(d);
      return {
        date: `${year}-${padMonth}-${String(dayNum).padStart(2, '0')}`,
        day: dayNum,
        revenue: dailyMap[dayNum].revenue,
        count: dailyMap[dayNum].count
      };
    });

    // Timeline
    let timelineData = [];
    let targetFilteredAppts = [];
    let previousPeriodRevenue = 0;

    if (granularity === 'year') {
      timelineData = yearlyRevenue.map(yr => ({
        key: String(yr.year),
        label: `Ano ${yr.year}`,
        secondaryLabel: `${yr.count} atendimentos`,
        revenue: yr.revenue,
        count: yr.count,
        growth: yr.growth,
        year: yr.year
      }));
      targetFilteredAppts = allAppointments.filter(a => {
        const y = parseInt(a.date.split('-')[0]);
        return trackedYears.includes(y);
      });
      previousPeriodRevenue = yearlyMap[year - 1] ? yearlyMap[year - 1].revenue : 0;
    } else if (granularity === 'month') {
      timelineData = monthlyRevenue.map((mr, idx) => {
        const prevMonthRev = idx > 0 ? monthlyRevenue[idx - 1].revenue : 0;
        const growth = prevMonthRev > 0 ? ((mr.revenue - prevMonthRev) / prevMonthRev) * 100 : 0;
        return {
          key: String(mr.month),
          label: mr.monthName.substring(0, 3),
          secondaryLabel: `${mr.monthName} / ${year}`,
          revenue: mr.revenue,
          count: mr.count,
          growth: Math.round(growth * 10) / 10,
          year,
          month: mr.month
        };
      });
      targetFilteredAppts = allAppointments.filter(a => a.date && a.date.startsWith(`${year}-`));
      previousPeriodRevenue = yearlyMap[year - 1] ? yearlyMap[year - 1].revenue : 0;
    } else {
      timelineData = dailyRevenue.map((dr, idx) => {
        const prevDayRev = idx > 0 ? dailyRevenue[idx - 1].revenue : 0;
        const growth = prevDayRev > 0 ? ((dr.revenue - prevDayRev) / prevDayRev) * 100 : 0;
        return {
          key: String(dr.day),
          label: `Dia ${dr.day}`,
          secondaryLabel: dr.date,
          revenue: dr.revenue,
          count: dr.count,
          growth: Math.round(growth * 10) / 10,
          year,
          month,
          day: dr.day
        };
      });

      if (day) {
        const padDay = String(day).padStart(2, '0');
        const exactDate = `${year}-${padMonth}-${padDay}`;
        targetFilteredAppts = allAppointments.filter(a => a.date === exactDate);
      } else {
        targetFilteredAppts = allAppointments.filter(a => a.date && a.date.startsWith(`${year}-${padMonth}-`));
      }

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      previousPeriodRevenue = allAppointments
        .filter(a => a.status === 'Concluído' && a.date && a.date.startsWith(prevMonthPrefix))
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    }

    // Metrics
    let totalRevenue = 0;
    let completedAppointments = 0;
    const totalAppointments = targetFilteredAppts.length;

    const procedureStatsMap = {};
    const professionalStatsMap = {};
    const paymentStatsMap = {};

    targetFilteredAppts.forEach(appt => {
      if (appt.status === 'Concluído') {
        const price = Number(appt.price) || 0;
        totalRevenue += price;
        completedAppointments++;

        const proc = appt.procedure || 'Outro';
        if (!procedureStatsMap[proc]) procedureStatsMap[proc] = { count: 0, revenue: 0 };
        procedureStatsMap[proc].count++;
        procedureStatsMap[proc].revenue += price;

        const prof = appt.professional || 'Flávia';
        if (!professionalStatsMap[prof]) professionalStatsMap[prof] = { count: 0, revenue: 0 };
        professionalStatsMap[prof].count++;
        professionalStatsMap[prof].revenue += price;

        const method = appt.paymentMethod || 'Pendente';
        if (!paymentStatsMap[method]) paymentStatsMap[method] = { count: 0, revenue: 0 };
        paymentStatsMap[method].count++;
        paymentStatsMap[method].revenue += price;
      }
    });

    const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    let growthRate = 0;
    if (previousPeriodRevenue > 0) {
      growthRate = Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 1000) / 10;
    }

    const procedureStats = Object.keys(procedureStatsMap)
      .map(proc => ({
        procedure: proc,
        count: procedureStatsMap[proc].count,
        revenue: procedureStatsMap[proc].revenue,
        percentage: totalRevenue > 0 ? (procedureStatsMap[proc].revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const professionalStats = Object.keys(professionalStatsMap)
      .map(prof => ({
        professional: prof,
        count: professionalStatsMap[prof].count,
        revenue: professionalStatsMap[prof].revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const paymentMethodStats = Object.keys(paymentStatsMap).map(m => ({
      method: m,
      count: paymentStatsMap[m].count,
      revenue: paymentStatsMap[m].revenue
    }));

    res.json({
      success: true,
      data: {
        period: {
          granularity,
          year,
          month,
          day,
          professional: professional || 'Todos'
        },
        metrics: {
          totalRevenue,
          totalAppointments,
          completedAppointments,
          averageTicket,
          completionRate,
          growthRate,
          previousRevenue: previousPeriodRevenue,
          revenueDifference: totalRevenue - previousPeriodRevenue
        },
        timelineData,
        dailyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        procedureStats,
        professionalStats,
        paymentMethodStats
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTAS - SERVICES
// ==========================================

app.get('/api/services', async (req, res) => {
  try {
    const { category, active } = req.query;
    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';

    const services = await Service.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, category, defaultPrice, durationMinutes, description } = req.body;
    const service = new Service({ name, category, defaultPrice, durationMinutes, description });
    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const service = await Service.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!service) {
      return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    }
    res.json({ success: true, message: 'Serviço removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTAS - PROFESSIONALS
// ==========================================

app.get('/api/professionals', async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const professionals = await Professional.find(query).sort({ name: 1 });
    res.json({ success: true, data: professionals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/professionals', async (req, res) => {
  try {
    const { name, role, phone, color, avatar } = req.body;
    const professional = new Professional({ name, role, phone, color, avatar });
    await professional.save();
    res.status(201).json({ success: true, data: professional });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/professionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const professional = await Professional.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profissional não encontrado' });
    }
    res.json({ success: true, data: professional });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/professionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findByIdAndDelete(id);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profissional não encontrado' });
    }
    res.json({ success: true, message: 'Profissional removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTAS - RECURRING PACKAGES
// ==========================================

app.get('/api/recurring-packages', async (req, res) => {
  try {
    const packages = await RecurringPackage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/recurring-packages', async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      packageName,
      durationMonths = 3,
      totalSessions = 4,
      usedSessions = 0,
      totalPrice = 0,
      paymentMethod = 'Pix',
      professional = 'Flávia',
      startDate,
      endDate,
      notes = '',
      status = 'Ativo',
    } = req.body;

    const newPkg = new RecurringPackage({
      clientName,
      clientPhone,
      packageName,
      durationMonths,
      totalSessions,
      usedSessions,
      totalPrice,
      paymentMethod,
      professional,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      notes,
      status,
    });

    await newPkg.save();
    res.status(201).json({ success: true, data: newPkg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/recurring-packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const pkg = await RecurringPackage.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Pacote não encontrado' });
    }
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/recurring-packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await RecurringPackage.findByIdAndDelete(id);
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Pacote não encontrado' });
    }
    res.json({ success: true, message: 'Pacote removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ROTAS DE SISTEMA
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API do Salão Flávia está funcionando!',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    serverIP: LOCAL_IP,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', async (req, res) => {
  let appointmentsCount = 0;
  let servicesCount = 0;
  let professionalsCount = 0;
  let recurringCount = 0;

  if (dbConnected) {
    try {
      appointmentsCount = await Appointment.countDocuments();
      servicesCount = await Service.countDocuments();
      professionalsCount = await Professional.countDocuments();
      recurringCount = await RecurringPackage.countDocuments();
    } catch (e) {}
  }

  res.json({
    status: 'online',
    database: {
      connected: dbConnected,
      cluster: 'Cluster0',
      databaseName: 'flavia_salao',
      error: null,
    },
    counts: {
      appointments: appointmentsCount,
      services: servicesCount,
      professionals: professionalsCount,
      recurringPackages: recurringCount,
    },
    serverTime: new Date().toISOString(),
    serverIP: LOCAL_IP,
    port: PORT,
    salon: 'Toque da Beleza',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API do Salão Flávia',
    version: '1.0.0',
    serverIP: LOCAL_IP,
    port: PORT,
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      appointments: '/api/appointments',
      history: '/api/appointments/history',
      financial: '/api/appointments/financial',
      batch: '/api/appointments/batch',
      recurringGroup: '/api/appointments/recurring-group/:groupId',
      services: '/api/services',
      professionals: '/api/professionals',
      recurringPackages: '/api/recurring-packages',
    },
  });
});

// ==========================================
// ROTA DE SEED MANUAL
// ==========================================

app.post('/api/seed', async (req, res) => {
  try {
    await seedDefaultDataIfEmpty();
    const count = await Appointment.countDocuments();
    res.json({
      success: true,
      message: `✅ Dados de exemplo gerados! ${count} agendamentos no banco.`,
      count
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// MIDDLEWARE DE ERRO
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Algo deu errado!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Salão Flávia rodando!`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`📡 IP: http://${LOCAL_IP}:${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health: http://${LOCAL_IP}:${PORT}/api/health`);
  console.log(`📋 History: http://${LOCAL_IP}:${PORT}/api/appointments/history`);
  console.log(`📈 Financial: http://${LOCAL_IP}:${PORT}/api/appointments/financial?month=8&year=2026`);
});