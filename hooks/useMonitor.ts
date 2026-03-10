import { useState } from 'react';
import { EscavadorProcesso } from '../types';
import { fetchProcessesByInvolved, fetchProcessData } from '../services/escavadorService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';

export function useMonitor() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EscavadorProcesso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [monitoringSuccess, setMonitoringSuccess] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // 1. Verificar se a entrada é um número de processo (CNJ)
      const cnjParts = parseCNJ(query);
      
      if (cnjParts) {
        // Se for um CNJ, buscar diretamente pelo número usando o endpoint de processos
        const formattedCNJ = formatCNJ(cnjParts);
        const data = await fetchProcessData(formattedCNJ);
        
        if (data) {
          setResults([data]);
        } else {
          setError("Processo não encontrado na base de dados do Escavador.");
        }
      } else {
        // 2. Se não for CNJ, buscar por envolvido (Nome ou CPF/CNPJ)
        const data = await fetchProcessesByInvolved(query);
        if (data && data.items) {
          setResults(data.items);
          if (data.items.length === 0) {
            setError("Nenhum processo encontrado para esta busca.");
          }
        } else {
          setError("Nenhum processo encontrado.");
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError("Ocorreu um erro ao buscar os processos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonitorClick = (process: EscavadorProcesso) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedProcess(process);
    setIsConfirmModalOpen(true);
  };

  const confirmMonitoring = () => {
    setIsConfirmModalOpen(false);
    // Simulação de sucesso no monitoramento
    setMonitoringSuccess(true);
    setTimeout(() => setMonitoringSuccess(false), 5000);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    setError,
    isWhatsappModalOpen,
    setIsWhatsappModalOpen,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    selectedProcess,
    monitoringSuccess,
    handleSearch,
    handleMonitorClick,
    confirmMonitoring
  };
}