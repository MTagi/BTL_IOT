import React, { useState, useEffect } from "react";
import { Col, Row, Card, message } from "antd";
import ControlPanel from "./components/ControlPanel"; // Import component ControlPanel
import Chart from "./components/Chart";
import GasChart from "./components/GasChart"; // Import GasChart
import LoginPanel from './components/LoginPanel'; // Import LoginPanel
import Chatbot from "./components/Chatbot";
import InfoCards from "./components/InfoCards";
import "./dashboardNew.scss";

export default function DashboardNew() {
  // State quản lý dữ liệu
  const [sensorData, setSensorData] = useState(null); // Dữ liệu từ API
  const [data, setData] = useState([]); // Dữ liệu môi trường
  const [gasData, setGasData] = useState([]); // Dữ liệu khí gas
  const [aqi, setAqi] = useState(50); // Chỉ số chất lượng không khí
  const [advice, setAdvice] = useState("Đang chờ đánh giá"); // Lời khuyên chất lượng không khí
  const [isAutoMode, setIsAutoMode] = useState(true); // Chế độ tự động

  // Hàm delay (nếu cần dùng trong tương lai)
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // useEffect tải dữ liệu
  useEffect(() => {
    const generateFakeData = async () => {
      try {
        // Fetch dữ liệu từ API
        const response = await fetch("http://localhost:5000/api/sensors");
        const result = await response.json();
        console.log("API response:", result);
        setSensorData(result);

        // Kiểm tra nếu sensorData chưa có dữ liệu
        if (!result) {
          message.warning("Dữ liệu cảm biến chưa có sẵn.");
          return;
        }

        // Dữ liệu môi trường (nhiệt độ, độ ẩm, ánh sáng)
        const envData = Array.from({ length: 60 }, () => ({
          time: new Date().toLocaleTimeString(),
          temperature: result.dht11.temperature || 0, // Tránh lỗi null
          humidity: result.dht11.humidity || 0,
          light: result.bh1750.lux || 0,
        }));
        setData(envData);

        // Dữ liệu khí gas
        const allGasData = Array.from({ length: 60 }, () => ({
          time: new Date().toLocaleTimeString(),
          CO2: result.mq135.co2ppm || 0,
          CO: result.mq135.coppm || 0,
          TVOC: result.mq135.tvocppm || 0,
          Ethanol: result.mq135.ethanolppm || 0,
          SO2: result.mq135.so2ppm || 0,
          NO2: result.mq135.no2ppm || 0,
        }));
        setGasData(allGasData);
        const response1 = await fetch("http://localhost:5000/api/aqi_chatbot");
        const result1 = await response1.json();
        // Cập nhật chỉ số AQI và lời khuyên
        const csAqi = result1.aqi; // AQI từ 1-150
        setAqi(csAqi);
        setAdvice(result1.chatbot_response);
      } catch (error) {
        message.error("Lỗi khi lấy dữ liệu từ API");
        console.error("Error fetching data:", error);
      }
    };

    if (isAutoMode) {
      // Lặp lại khi ở chế độ tự động
      const intervalId = setInterval(() => {
        generateFakeData();
      }, 20000);

      return () => clearInterval(intervalId);
    }
  }, [isAutoMode]); // Theo dõi sự thay đổi của isAutoMode

  return (
    <div className="dashboardNew">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <LoginPanel />
        </Col>
      </Row>
      {/* Thông tin môi trường */}
      <InfoCards
        temperature={data[data.length - 1]?.temperature || 0} // Giá trị mặc định nếu null
        humidity={data[data.length - 1]?.humidity || 0}
        light={data[data.length - 1]?.light || 0}
      />

      {/* Component Chatbot */}
      <Chatbot aqi={aqi} advice={advice} />

      {/* Khối điều khiển thiết bị và hiển thị chất */}
      <Row gutter={20} className="control-and-quality">
        <Col span={16}>
          <ControlPanel /> {/* Component điều khiển */}
        </Col>
        <Col span={8}>
          <Card className="quality-list">
            <h3>Nồng độ các chất: </h3>
            <ul>
              {gasData.length > 0 ? (
                <>
                  <li>CO2: {gasData[gasData.length - 1]?.CO2 || 0} <span>ppm</span></li>
                  <li>CO: {gasData[gasData.length - 1]?.CO || 0} <span>ppm</span></li>
                  <li>TVOC: {gasData[gasData.length - 1]?.TVOC || 0} <span>ppm</span></li>
                  <li>Ethanol: {gasData[gasData.length - 1]?.Ethanol || 0} <span>ppm</span></li>
                  <li>SO2: {gasData[gasData.length - 1]?.SO2 || 0} <span>ppm</span></li>
                  <li>NO2: {gasData[gasData.length - 1]?.NO2 || 0} <span>ppm</span></li>
                </>
              ) : (
                <p>Đang tải dữ liệu...</p>
              )}
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Row className="chart-section" gutter={[16, 16]}>
        <Col span={12}>
          <Card className="chart-container">
            <Chart data={data} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="chart-container">
            <GasChart data={gasData} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
