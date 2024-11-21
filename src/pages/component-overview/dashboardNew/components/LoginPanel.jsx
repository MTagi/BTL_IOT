import React, { useState } from "react";
import { Input, Button, Form, message, Card, Row, Col } from "antd";
import "./loginPanel.scss"; // Thêm file CSS nếu cần

const LoginPanel = () => {
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    try {
      const { ipAddress, username, password } = values; // Lấy cả 3 giá trị từ form
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ipAddress, username, password }), // Gửi cả 3 giá trị
      });
  
      if (response.ok) {
        const result = await response.json();
        message.success("Đăng nhập thành công!");
        console.log("Login response:", result);
      } else {
        const error = await response.json();
        message.error(error.message || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin!");
      }
    } catch (error) {
      message.error("Lỗi kết nối tới máy chủ!");
      console.error("Login error:", error);
    }
  };
  
  

  return (
    <Card className="login-panel">
      <h3>Đăng nhập hệ thống</h3>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        className="login-form"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Địa chỉ IP"
              name="ipAddress"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ IP!" }]}
            >
              <Input placeholder="Nhập địa chỉ IP" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Tài khoản"
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
            >
              <Input placeholder="Nhập tài khoản" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LoginPanel;
