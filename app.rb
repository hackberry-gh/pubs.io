require 'sinatra'
require 'httparty'

# GASTRO_PUB="4bf58dd8d48988d155941735"
# IRISH_PUB="52e81612bcbc57f1066b7a06"
# PUB="4bf58dd8d48988d11b941735"

get "/" do
  erb :index
end

post "/" do

  response = HTTParty.get("https://api.foursquare.com/v2/venues/#{params[:method]}", {query: {
    client_id: ENV['FS_ID'], client_secret: ENV['FS_SECRET'], 
    ll: params[:ll], 
    intent: params[:intent],
    radius: params[:radius],
    categoryId: "4bf58dd8d48988d11b941735",
    v: 20140806,
    m: "foursquare"
    }})
  content_type :json
  response.body
end