export type UsuarioDTO = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT" | "SERVICE";
};

export type ExperimentoDTO = {
  id: number;
  title: string;
  contaminant: string;
  materialMass: number;
  solutionVolume: number;
  initialConcentration: number;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  user: UsuarioDTO;
  replicates: ReplicaDTO[];
};

export type ReplicaDTO = {
  id: number;
  replicateNum: number;
  materialMass: number | null;
  measurements: MedicionDTO[];
};

export type MedicionDTO = {
  id: number;
  timeHours: number;
  absorbance: number;
};

export type EquipoDTO = {
  id: number;
  name: string;
  model: string | null;
  description: string | null;
  maintenanceDays: number;
  lastMaintenance: Date | null;
};

export type UsoEquipoDTO = {
  id: number;
  equipmentId: number;
  equipmentName: string;
  userName: string;
  startAt: Date;
  endAt: Date | null;
  description: string;
};

export type AsistenciaDTO = {
  id: number;
  userId: number;
  userName: string;
  checkIn: Date;
  checkOut: Date | null;
  type: string;
  duration: number | null;
};

export type ReactivoDTO = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  minStock: number;
  location: string | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  stockBajo: boolean;
};

export type MovimientoReactivoDTO = {
  id: number;
  reagentId: number;
  userId: number;
  userName: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: Date;
};
