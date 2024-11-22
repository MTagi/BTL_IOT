#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <PubSubClient.h>
//Wiffi
const char* ssid = "Lenam";
const char* password = "Lenam1412";

// Định nghĩa thông tin MQTT Broker
const char* mqtt_server = "172.20.10.2";  // Địa chỉ IP của MQTT Broker
const int mqtt_port = 1883;                 // Cổng của MQTT Broker
const char* mqtt_user = "thang";    // Username của MQTT Broker
const char* mqtt_pass = "thang1411";    // Password của MQTT Broker

Servo myServo; // Tạo đối tượng servo cho cửa

#define FAN_PIN 25  // Chân GPIO điều khiển quạt
#define LIGHT_PIN 26  // Chân GPIO điều khiển đèn
#define BUZZER_PIN 27  // Chân GPIO điều khiển còi
#define DOOR_PIN 14  // Chân GPIO điều khiển cửa

// Định nghĩa chân kết nối và loại cảm biến DHT
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Định nghĩa chân kết nối với MQ135
const int MQ135pin=34;
/// Parameters to model temperature and humidity dependence
#define CORA .00035
#define CORB .02718
#define CORC 1.39538
#define CORD .0018
#define CORE -.003333333
#define CORF -.001923077
#define CORG 1.130128205

// The load resistance on the board
#define RLOAD 10.0
// Calibration resistance at atmospheric CO2 level
#define CO2RZERO 700
// Calibration resistance at atmospheric CO level
#define CORZERO 500
// Calibration resistance at atmospheric TVOC level
#define TVOCRZERO 700

// Parameters for calculating ppm of CO2 from sensor resistance
#define CO2PARA 16.67
#define CO2PARB 1.4
// Parameters for calculating ppm of CO from sensor resistance
#define COPARA 0.0005226779
#define COPARB 3.8465  
// Parameters for calculating ppm of TVOC from sensor resistance
#define TVOCPARA  10.0 
#define TVOCPARB  0.9 


// Các hằng số cho các khí đo (Ethanol, SO2, NO2)
#define ETHANOLPARA  1.0
#define ETHANOLRZERO  50.0
#define ETHANOLPARB  2.5

#define SO2PARA  1.5
#define SO2RZERO  75.0
#define SO2PARB  2.2

#define NO2PARA  2.0
#define NO2RZERO  60.0
#define NO2PARB  2.1

// Định nghĩa BH1750fiv
BH1750 lightMeter;

unsigned long previousMillis = 0; 
const long interval = 5000;
int current_ledState = LOW;
int last_ledState = LOW;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastMsg = 0;  // Biến lưu thời gian gửi dữ liệu cuối cùng
char msg[50];

void setup_wifi() {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Kết nối đến MQTT Broker và đăng ký các topic
void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Thêm username và password khi kết nối đến MQTT Broker
    if (mqttClient.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      mqttClient.subscribe("home/fan");
      mqttClient.subscribe("home/light");
      mqttClient.subscribe("home/door");
      mqttClient.subscribe("home/buzzer");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}
// Callback nhận dữ liệu từ MQTT Broker
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message received on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  Serial.println(message);

  // Kiểm tra và điều khiển thiết bị theo topic và payload
  if (String(topic) == "home/fan") {
    if (message == "ON") {
        controlFan(true);
    } else if (message == "OFF") {
        controlFan(false);
    }
    
  } else if (String(topic) == "home/light") {
    if (message == "ON") {
      controlLight(true);
    } else if (message == "OFF") {
      controlLight(false);
    }
  } else if (String(topic) == "home/door") {
    if (message == "ON") {
      controlDoor(true);
    } else if (message == "OFF") {
      controlDoor(false);
    }
  }
  else if (String(topic) == "home/buzzer"){
    if (message == "ON") {
      controlBuzzer(true);
    } else if (message == "OFF") {
      controlBuzzer(false);
    }

  }
}
void setup() {
  delay(10000);
  // Khởi động Serial Monitor
  Serial.begin(9600);

  Serial.println("Khởi động hệ thống...");
  //Kết nối Wiffi
  setup_wifi();
  // setup mqtt server
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);
  // Khởi tạo MQ135
  pinMode(MQ135pin,INPUT);
  // Khởi tạo cảm biến DHT
  dht.begin();
  // Khởi tạo wire
  Wire.begin();
  // Khởi tạo cảm biến BH1750
  lightMeter.begin();

  myServo.attach(19);

  // Khởi tạo các chân điều khiển thiết bị 
  pinMode(FAN_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(DOOR_PIN, OUTPUT);

// Điều khiển các thiết bị
  controlFan(false);   // Bật quạt
  controlLight(false); // Bật đèn
  controlBuzzer(false);  // Tắt còi
  controlDoor(false);    // Đóng cửa

  Serial.println("Hệ thống đã sẵn sàng");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();

  // Đọc nhiệt độ và độ ẩm
  float temperature = readTemperature();
  float humidity = readHumidity();
  // Kiểm tra lỗi cảm biến
  if (isnan(temperature) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Gửi dữ liệu nhiệt độ, độ ẩm và ánh sáng qua MQTT
  char jsonBufferDHT11[100];
  snprintf(jsonBufferDHT11, sizeof(jsonBufferDHT11), "{\"temperature\": %.2f, \"humidity\": %.2f}", temperature, humidity);

  // Gửi dữ liệu lên MQTT
  Serial.print("Publishing message: ");
  Serial.println(jsonBufferDHT11);
  mqttClient.publish("esp/dht11", jsonBufferDHT11);

  float co2ppm=getCO2CorrectedPPM(temperature, humidity);
  float coppm=getCOCorrectedPPM(temperature, humidity);
  float tvocppm=getTVOCCorrectedPPM(temperature, humidity);
  float ethanolppm=getEthanolCorrectedPPM(temperature, humidity);
  float so2ppm= getSO2CorrectedPPM(temperature, humidity);
  float no2ppm= getNO2CorrectedPPM(temperature, humidity);

  char jsonBufferMQ135[150];  // Dùng bộ nhớ đủ lớn cho dữ liệu
  // Tạo chuỗi JSON với các giá trị PPM
  snprintf(jsonBufferMQ135, sizeof(jsonBufferMQ135), 
            "{\"co2ppm\": %.2f, \"coppm\": %.2f, \"tvocppm\": %.2f, \"ethanolppm\": %.2f, \"so2ppm\": %.2f, \"no2ppm\": %.2f}",
            co2ppm, coppm, tvocppm, ethanolppm, so2ppm, no2ppm);
  // Gửi dữ liệu lên MQTT
  Serial.print("Publishing message to esp/mq135: ");
  Serial.println(jsonBufferMQ135);
  mqttClient.publish("esp/mq135", jsonBufferMQ135);
  

  float lux = lightMeter.readLightLevel();
  char jsonBufferBH1750[50];  // Dùng bộ nhớ đủ lớn cho dữ liệu
// Tạo chuỗi JSON với giá trị lux
  snprintf(jsonBufferBH1750, sizeof(jsonBufferBH1750), "{\"lux\": %.2f}", lux);

  // Gửi dữ liệu lên MQTT
  Serial.print("Publishing message to esp/bh1750: ");
  Serial.println(jsonBufferBH1750);
  mqttClient.publish("esp/bh1750", jsonBufferBH1750);
  delay(1000);
}

// Hàm đọc nhiệt độ
float readTemperature() {
  float temperature = dht.readTemperature();
  return isnan(temperature) ? 0.0 : temperature;
}

// Hàm đọc độ ẩm
float readHumidity() {
  float humidity = dht.readHumidity();
  return isnan(humidity) ? 0.0 : humidity;
}
void controlFan(bool state) {
    if (state) {
        digitalWrite(FAN_PIN, LOW);  // Bật quạt
    } else {
        digitalWrite(FAN_PIN, HIGH);   // Tắt quạt
    }
}
void controlLight(bool state) {
    if (state) {
        digitalWrite(LIGHT_PIN, LOW);  // Bật đèn
    } else {
        digitalWrite(LIGHT_PIN, HIGH);   // Tắt đèn
    }
}
void controlBuzzer(bool state) {
    if (state) {
        digitalWrite(BUZZER_PIN, LOW);  // Bật còi
    } else {
        digitalWrite(BUZZER_PIN, HIGH);   // Tắt còi
    }
}
void controlDoor(bool state) {
    if (state) {
        digitalWrite(DOOR_PIN, LOW);  // Mở cửa
        rotateServo(180);
        delay(1000); // Đợi servo hoàn thành chuyển động
    } else {
        rotateServo(90);
        delay(1000);
        digitalWrite(DOOR_PIN, HIGH);   // Đóng cửa
    }
}
// Hàm để xoay servo đến một góc nhất định
void rotateServo(int angle) {
    myServo.write(angle);          // Xoay servo đến góc chỉ định
    delay(1000);                    // Chờ servo xoay xong
}

float getResistance()
{
    int val = analogRead(MQ135pin);
    return ((1023. / (float)val) *5.0 - 1.) * RLOAD;
}

float getCorrectionFactor(float t, float h) {
    // Linearization of the temperature dependency curve under and above 20 degree C
    // below 20degC: fact = a * t * t - b * t - (h - 33) * d
    // above 20degC: fact = a * t + b * h + c
    // this assumes a linear dependency on humidity
    if(t < 20){
        return CORA * t * t - CORB * t + CORC - (h-33.)*CORD;
    } else {
        return CORE * t + CORF * h + CORG;
    }
}

float getCorrectedResistance(float t, float h) {
  return getResistance()/getCorrectionFactor(t, h);
}
float getCO2CorrectedPPM(float t, float h)
{
    return CO2PARA * pow((getCorrectedResistance(t, h) / CO2RZERO), -CO2PARB);
}

float getCOCorrectedPPM(float t, float h)
{
    return COPARA * pow((getCorrectedResistance(t, h) / CORZERO), -COPARB);
}
float getTVOCCorrectedPPM(float t, float h){
    return  TVOCPARA * pow((getCorrectedResistance(t, h) / TVOCRZERO), -TVOCPARB);
}
// Hàm tính nồng độ Ethanol đã hiệu chỉnh (ppm)
float getEthanolCorrectedPPM(float t, float h) {
    return ETHANOLPARA * pow((getCorrectedResistance(t, h) / ETHANOLRZERO), -ETHANOLPARB);
}

// Hàm tính nồng độ SO2 đã hiệu chỉnh (ppm)
float getSO2CorrectedPPM(float t, float h) {
    return SO2PARA * pow((getCorrectedResistance(t, h) / SO2RZERO), -SO2PARB);
}

// Hàm tính nồng độ NO2 đã hiệu chỉnh (ppm)
float getNO2CorrectedPPM(float t, float h) {
    return NO2PARA * pow((getCorrectedResistance(t, h) / NO2RZERO), -NO2PARB);
}




 

