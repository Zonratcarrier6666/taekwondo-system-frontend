export interface Alumno {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
  fechanacimiento: string;
  nombretutor: string;
  telefonocontacto: string;
  correotutor: string | null;
  direcciondomicilio: string;
  grado_escolar: string;
  escuela_procedencia: string;
  fotoalumno: string | null;
  tipo_sangre: string;
  alergias: string;
  padecimientos_cronicos: string;
  seguro_medico: string;
  nss_o_poliza: string;
  idgradoactual: number;
  idescuela: number;
  idprofesor: number | null;
  fecharegistro: string;
}

export interface AlumnoCreateDTO {
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
  fechanacimiento: string;
  nombretutor: string;
  telefonocontacto: string;
  correotutor: string;
  direcciondomicilio: string;
  grado_escolar: string;
  escuela_procedencia: string;
  tipo_sangre: string;
  alergias: string;
  padecimientos_cronicos: string;
  seguro_medico: string;
  nss_o_poliza: string;
  idgradoactual: number;
  idprofesor: number | null;
}

export interface AlumnoUpdateDTO extends Partial<AlumnoCreateDTO> {
  estatus?: number;
}