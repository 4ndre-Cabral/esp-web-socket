#include <ArduinoWebsockets.h>

const char* ssid = "VERO-FELIPE"; // Nome da rede
const char* password = "cabral1991"; // Senha da rede
const char* websockets_server_host = "192.168.4.129"; // IP do servidor websocket
const int websockets_server_port = 8080; // Porta de conexão do servidor

// Utilizamos o namespace de websocket para podermos utilizar a classe WebsocketsClient
using namespace websockets;

// Objeto websocket client
WebsocketsClient client;

// Led indicador do motor
const int led = D4;
const int light = D2;

//---- Pinos de controle-- 
#define STP 14 // Avanço do passo | Arduino: 7 | ESP: 14
#define DIR 12 // Direção do passo | Arduino: 6 | ESP: 12
#define ENA 13 // Função ENABLE  | Arduino: 5 | ESP: 13
//---- Variáveis de controle ----
int PPR = 0;      // pulsos por resolução
int passo = 0;    // passos
int temp = 5000;  // tempo entre os passos

void setup ()
{
  pinMode(STP, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(DIR, OUTPUT);
  digitalWrite(DIR, LOW);
  digitalWrite(STP, LOW);
  digitalWrite(led, HIGH);
  digitalWrite(light, HIGH);
  digitalWrite(ENA, HIGH);
  // Iniciamos a serial com velocidade de 115200
  Serial.begin(115200);
  delay(100);

  for(uint8_t t = 4; t > 0; t--) {
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  // Definimos o pino como saída
  pinMode(led, OUTPUT);
  pinMode(light, OUTPUT);

  // Conectamos o wifi
  WiFi.begin(ssid, password);

  // Enquanto não conectar printamos um "."
  while(WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(1000);
  }

  // Exibimos "WiFi Conectado"
  String ip = WiFi.localIP().toString();
  Serial.printf("[SETUP] WiFi Connected %s\n", ip.c_str());
  Serial.println("Connecting to server.");

  // Tentamos conectar com o websockets server
  bool connected = client.connect(websockets_server_host, websockets_server_port, "/");

  // Se foi possível conectar
  if(connected) 
  {
    // Exibimos mensagem de sucesso
    Serial.println("Connected!");
    // Enviamos uma msg "Hello Server" para o servidor
    client.send("hello_from_esp");
  }   // Se não foi possível conectar
  else 
  {
    // Exibimos mensagem de falha
    Serial.println("Not Connected!");
    return;
  }
  
  // Iniciamos o callback onde as mesagens serão recebidas
  client.onMessage([&](WebsocketsMessage message)
  {        
    // Exibimos a mensagem recebida na serial
    Serial.print("Got Message: ");
    Serial.println(message.data());

    // Ligamos/Desligamos o led de acordo com o comando
    if(message.data().equalsIgnoreCase("ON_WINDOW"))
    {
      PPR = 200;
      ABRIR_JANELA();
      ciclo();
    }
    else if(message.data().equalsIgnoreCase("OFF_WINDOW"))
    {
      PPR = 200;
      FECHAR_JANELA();   
      ciclo();
    }
    else if(message.data().equalsIgnoreCase("ON"))
    {
      digitalWrite(light, LOW);
    }
    else if(message.data().equalsIgnoreCase("OFF"))
    {
      digitalWrite(light, HIGH);
    }
  });
}

void loop()
{
  //  De tempo em tempo, o websockets client checa por novas mensagens recebidas
  if(client.available()) 
      client.poll();
      
  delay(300);
}

void ciclo() {
  EN1();
  while (PPR > passo)
  { // Enquanto PPR for maior que passo
    // Avança o passo
    digitalWrite(STP, LOW);
    delayMicroseconds(temp); //Tempo em Microseconds
    digitalWrite(STP, HIGH);
    delayMicroseconds(temp);
    passo++; // Aumenta em 1 o valor de passo
    yield(); // watchdog reset
  }
  passo = 0; // valor de passso muda pra 0
  EN2();
}
void ABRIR_JANELA() {                // Sentido Horário
  passo = 0;
  Serial.println("open_window");
  client.send("open_window");
  digitalWrite(DIR, HIGH);
}
void FECHAR_JANELA()  {               // Sentido Anti-Horário
  passo = 0;
  Serial.println("close_window");
  client.send("close_window");
  digitalWrite(DIR, LOW);
}
void EN1()  {               // Ativa o Enable
  digitalWrite(led, LOW);
  digitalWrite(ENA, LOW);
  delay(10);
}
void EN2()  {               // Desativa o Enable
  digitalWrite(led, HIGH);
  digitalWrite(ENA, HIGH);
  delay(10);
  Serial.println("end_window");
  client.send("end_window");
}
