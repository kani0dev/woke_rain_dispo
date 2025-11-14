import { useState, useEffect } from 'react';
import './App.css'
// === CONFIGURAÇÕES DO ADAFRUIT IO ===
const AIO_USERNAME = "kani0dev";
const AIO_KEY = "aio_fbQZ99zlWA71d253dU2nWgFw8KL0"; 
const FEED_KEY = "umidade";

const API_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_KEY}/data/last`;

// === Função que retorna apenas o texto do status ===
const getHumidityStatus = (humidity) => {
    const value = parseFloat(humidity);
    if (isNaN(value) || value < 0) {
        return { message: 'Aguardando dados ou Erro' };
    }
    if (value >= 99) return { message: 'RISCO CRÍTICO (ALAGAMENTO!)' };
    if (value >= 95) return { message: 'ALTO RISCO (CHUVA FORTE)' };
    return { message: 'Nível de Umidade Normal' };
};

// === FUNÇÃO DE COR DINÂMICA DO FUNDO ===
// 0% → Amarelo (#FFD700)
// 100% → Vermelho (#FF0000)
const getBackgroundColor = (value) => {

    if (isNaN(value)) return "#ccc";

    const amount = Math.min(Math.max(value / 100, 0), 1);  // 0–1

    const r = 255;                       // sempre 255
    const g = Math.floor(215 * (1 - amount));  // 215 → 0 conforme chega em 100%
    const b = 0;

    return `rgb(${r}, ${g}, ${b})`;
};

const App = () => {
  const [umidade, setUmidade] = useState('--');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchUmidade = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-AIO-Key': AIO_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      setUmidade(data.value);
      setLastUpdated(new Date());

    } catch (erro) {
      setError("Erro ao carregar dados.");
      setUmidade('ERRO');
      console.log(erro);
      
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUmidade();
    const interval = setInterval(fetchUmidade, 5000);
    return () => clearInterval(interval);
  }, []);

  const umidadeFloat = parseFloat(umidade);

  // === CSS-IN-JS GLOBAL PARA O LAYOUT ===
  const humidityBoxStyle = {
    padding: "20px",
    borderRadius: "12px",
    marginTop: "10px",
    fontSize: "2rem",
    color: "#000",
    backgroundColor: getBackgroundColor(umidadeFloat),
    transition: "background-color 0.6s ease-in-out",
    fontWeight: "bold",
    border: "2px solid #00000022",
  };

  const cardStyle = {
    padding: "15px",
    marginTop: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fafafa"
  };

  return (
    <div className='containerStyle'>
      <header>
        <h1>Monitoramento de Umidade IoT</h1>
        <p>Feed Adafruit IO: "{FEED_KEY}"</p>
      </header>

      <div style={cardStyle}>
        <h2>Umidade Atual</h2>

        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <div style={humidityBoxStyle} className='deusSoMeLeva'>
            {loading || isNaN(umidadeFloat)
              ? "Carregando..."
              : `${umidadeFloat.toFixed(0)}%`}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>Status de Risco:</h3>
        <p>{loading ? "BUSCANDO DADOS..." : getHumidityStatus(umidade).message}</p>
      </div>

      <footer style={{ marginTop: "20px", opacity: 0.7 }}>
        Última atualização:{" "}
        {loading
          ? "Buscando..."
          : lastUpdated?.toLocaleTimeString("pt-BR") ?? "Agora"}
      </footer>
    
    </div>
  );
};

export default App;
