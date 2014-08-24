$stdout.sync = true

require 'sinatra'
require 'httparty'
require "sinatra/reloader" if development?

# GASTRO_PUB="4bf58dd8d48988d155941735"
# IRISH_PUB="52e81612bcbc57f1066b7a06"
# PUB="4bf58dd8d48988d11b941735"

enable :sessions
set :session_secret, "4bf58dd8d48988d11b94173552e81612bcbc57f1066b7a064bf58dd8d48988d155941735"

get "/" do
  erb :index
end

get "/redirect" do
  response = HTTParty.get("https://foursquare.com/oauth2/access_token", {query: {
    client_id: ENV['FS_ID'], client_secret: ENV['FS_SECRET'], 
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:5000/redirect",
    code: params[:code],
    v: 20140806,
    m: "foursquare"    
    }})
  puts JSON.parse(response.body).inspect  
  session[:token] = JSON.parse(response.body)["access_token"]
  puts ""
  puts "SESSION #{session[:token]}"
  puts ""
  redirect "/"
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

get "/signin" do
  redirect "https://foursquare.com/oauth2/authenticate?client_id=#{ENV['FS_ID']}&response_type=code&redirect_uri=http://localhost:5000/redirect"
end

post "/checkin" do
  content_type :json
  unless session[:token]
    {meta: "signin"}.to_json
  else
    puts "SESSION #{session[:token]}"    
    response = HTTParty.post("https://api.foursquare.com/v2/checkins/add", {body: {
      client_id: ENV['FS_ID'], client_secret: ENV['FS_SECRET'], 
      venueId: params[:venue_id], 
      oauth_token: session[:token],
      v: 20140806,
      m: "foursquare"
      }})
    response.body    
  end
  
end

get "/venue/:id" do
  content_type :json
  response = HTTParty.get("https://api.foursquare.com/v2/venues/#{params[:id]}/photos",{query: {
      client_id: ENV['FS_ID'], client_secret: ENV['FS_SECRET'], 
      v: 20140806,
      m: "foursquare"
      }})
  response.body
end