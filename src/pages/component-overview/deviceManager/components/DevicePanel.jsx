import React, { useState } from 'react';
import { Table, Button, Input, message, Modal, Form, Menu, Dropdown } from 'antd';

const { Search } = Input;

const fakeData = [
  { id: '1', device: 'Sensor A', status: 'Active' },
  { id: '2', device: 'Sensor B', status: 'Inactive' },
  { id: '3', device: 'Camera X', status: 'Active' },
  { id: '4', device: 'Thermostat Y', status: 'Inactive' },
  { id: '5', device: 'Device Z', status: 'Active' },
];

const DevicePanel = () => {
  const [data, setData] = useState(fakeData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  // Xóa thiết bị
  const handleDelete = (record) => {
    setData((prevData) => prevData.filter((item) => item.id !== record.id));
    message.success('Device deleted successfully!');
  };

  // Hiển thị modal sửa thiết bị
  const showEditModal = (record) => {
    setEditingDevice(record);
    setIsEditModalVisible(true);
    form.setFieldsValue(record);
  };

  // Xử lý lưu khi sửa thiết bị
  const handleEditOk = async () => {
    try {
      const values = await form.validateFields();
      setData((prevData) =>
        prevData.map((item) =>
          item.id === editingDevice.id ? { ...item, ...values } : item
        )
      );
      message.success('Device updated successfully!');
      form.resetFields();
      setIsEditModalVisible(false);
      setEditingDevice(null);
    } catch (error) {
      message.error('Please fill out all fields!');
    }
  };

  // Hủy sửa thiết bị
  const handleEditCancel = () => {
    form.resetFields();
    setIsEditModalVisible(false);
    setEditingDevice(null);
  };

  // Hiển thị modal thêm thiết bị
  const showAddModal = () => {
    setIsModalVisible(true);
  };

  // Xử lý lưu khi thêm thiết bị
  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields();
      const newDevice = {
        id: Date.now().toString(), // Tạo ID duy nhất
        ...values,
      };
      setData((prevData) => [...prevData, newDevice]);
      message.success('Device added successfully!');
      addForm.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error('Please fill out all fields!');
    }
  };

  // Hủy thêm thiết bị
  const handleAddCancel = () => {
    addForm.resetFields();
    setIsModalVisible(false);
  };

  // Menu của dropdown
  const menu = (record) => (
    <Menu>
      <Menu.Item key="edit" onClick={() => showEditModal(record)}>
        Edit
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => handleDelete(record)}>
        Delete
      </Menu.Item>
    </Menu>
  );

  // Cột trong bảng
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Dropdown overlay={menu(record)} trigger={['click']}>
          <Button type="link">Actions</Button>
        </Dropdown>
      ),
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
        <Search placeholder="Search devices" style={{ width: 200 }} />
        <Button type="primary" onClick={showAddModal}>
          Add Device
        </Button>
      </div>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        pagination={{ pageSize: 5 }}
      />
      {/* Modal thêm thiết bị */}
      <Modal
        title="Add Device"
        visible={isModalVisible}
        onOk={handleAddOk}
        onCancel={handleAddCancel}
      >
        <Form form={addForm} layout="vertical">
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
      {/* Modal sửa thiết bị */}
      <Modal
        title="Edit Device"
        visible={isEditModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
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
