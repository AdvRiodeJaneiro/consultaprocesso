import {
  Search,
  LayoutDashboard,
  Gavel,
  Zap,
  Settings,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  maintenance?: boolean;
  adminOnly?: boolean;
}

export const MAIN_MENU: MenuItem[] = [
  { 
    id: 'search-number', 
    label: 'Consulta Processo', 
    icon: Search, 
    path: '/' 
  },
  { 
    id: 'monitor-new', 
    label: 'Consulta CPF e CNPJ', 
    icon: LayoutDashboard, 
    path: '/monitoramento',
    maintenance: true 
  },
  { 
    id: 'my-processes', 
    label: 'Processos Monitorados', 
    icon: Gavel, 
    path: '/meus-processos' 
  },
  { 
    id: 'pricing', 
    label: 'Assinar Plano', 
    icon: Zap, 
    path: '/planos' 
  },
];

export const ADMIN_MENU: MenuItem[] = [
  { 
    id: 'settings', 
    label: 'Gestão de Planos', 
    icon: Settings, 
    path: '/configuracoes',
    adminOnly: true
  },
  {
    id: 'z-api',
    label: 'Integração WhatsApp',
    icon: Smartphone,
    path: '/z-api',
    adminOnly: true
  }
];