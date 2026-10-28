require 'webrick'
require 'socket'

# Find an available port, prioritizing 5000, 5050, 8000, 8080
def port_available?(port)
  server = TCPServer.new('127.0.0.1', port)
  server.close
  true
rescue Errno::EADDRINUSE, Errno::EACCES
  false
end

candidate_ports = [5000, 5050, 8000, 8080, 3000]
port = candidate_ports.find { |p| port_available?(p) } || 8080
root = File.expand_path(File.dirname(__FILE__))

server = WEBrick::HTTPServer.new(
  Port: port,
  BindAddress: '127.0.0.1',
  DocumentRoot: root,
  AccessLog: [],
  Logger: WEBrick::Log.new($stderr, WEBrick::BasicLog::INFO)
)

trap('INT')  { server.shutdown }
trap('TERM') { server.shutdown }

puts "=========================================================="
puts "  BEL PROBLEM 1606 RADAR DEFENSE SURVEILLANCE SERVER"
puts "  Server running at: http://127.0.0.1:#{port}/"
puts "=========================================================="
$stdout.flush

server.start
