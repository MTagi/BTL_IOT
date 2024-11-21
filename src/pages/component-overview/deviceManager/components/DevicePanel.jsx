import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message, Modal, Form } from 'antd';

const { Search } = Input;

const DevicePanel = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ['5', '10', '20', '50'],
      total: 0,
    },
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch data from the server
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/devices');
      const result = await response.json();
      setData(result);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: result.length,
        },
      });
    } catch (error) {
      message.error('Error fetching data!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sorter,
    });
  };

  const onSearch = (value) => {
    const filteredData = data.filter((item) =>
      item.device.toLowerCase().includes(value.toLowerCase())
    );
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        total: filteredData.length,
      },
    });
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newDevice = {
        id: Date.now().toString(), // Generate a unique ID
        device: values.device,
        status: values.status,
      };
      setData((prevData) => [...prevData, newDevice]);
      message.success('Device added successfully!');
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error('Please fill out all fields!');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      sorter: (a, b) => a.device.localeCompare(b.device),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <Search
          placeholder="Search devices"
          onSearch={onSearch}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={showModal}>
          Add Device
        </Button>
      </div>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        loading={loading}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        scroll={{ y: 400 }}
      />
      <Modal
        title="Add Device"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="device"
            label="Device Name"
            rules={[{ required: true, message: 'Please enter device name' }]}
          >
            <Input placeholder="Enter device name" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select device status' }]}
          >
            <Input placeholder="Enter status (Active/Inactive)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DevicePanel;
