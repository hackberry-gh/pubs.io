$stdout.sync = true

require 'sinatra'
require 'httparty'
require "sinatra/reloader" if development?


set :host, settings.development? ? "localhost:5000" : "www.pubs.io"
set :categories, {
  "gastro_pub" => "4bf58dd8d48988d155941735", 
  "irish_pub" => "52e81612bcbc57f1066b7a06", 
  "pub" => "4bf58dd8d48988d11b941735"
}
set :default_api_params, defaults = {
  client_id: ENV['FS_ID'], 
  client_secret: ENV['FS_SECRET'],
  v: 20140806,
  m: "foursquare"
}
enable :sessions
set :session_secret, "4bf58dd8d48988d11b94173552e81612bcbc57f1066b7a064bf58dd8d48988d155941735"

helpers do
  
  def api method, endpoint, params = {}
    params.update(settings.default_api_params)
    params = method == :get ? {query: params} : {body: params}
    HTTParty.send(method,"https://api.foursquare.com/v2#{endpoint}", params)
  end
  
  def signed_in?
    !session[:token].nil?
  end
  
  def authenticate!
    unless signed_in?
      session[:post_signin_action] = JSON.dump({endpoint:request.path, params: params})
      halt 401 
    end
  end
  
  def ensure_user_id
    if signed_in? && session[:user_id].nil?
      response = api(:get, "/users/self", {oauth_token: session[:token]})
      session[:user_id] = response["response"]["user"]["id"]
    end
  end
  
end

get "/" do
  ensure_user_id
  erb :index
end

get "/signin" do
  redirect "https://foursquare.com/oauth2/authenticate?client_id=#{ENV['FS_ID']}&response_type=code&redirect_uri=http://#{settings.host}/authenticate"
end

get "/authenticate" do
  response = HTTParty.get("https://foursquare.com/oauth2/access_token", {query: {
    grant_type: "authorization_code",
    redirect_uri: "http://#{settings.host}/authenticate",
    code: params[:code]
  }.update(settings.default_api_params)})
  session[:token] = JSON.parse(response.body)["access_token"]
  
  ensure_user_id
  
  if session[:post_signin_action]

    action = JSON.parse(session[:post_signin_action])  
    
    response = api(:post, action['endpoint'], {
      oauth_token: session[:token]
    }.update(action['params']))
    
    session[:post_signin_action] = nil  

  end
  redirect "/"
end

get "/venues/:method" do
  content_type :json  
  response = api(:get, request.path, {
    ll: params[:ll], 
    intent: params[:intent],
    radius: params[:radius],
    categoryId: settings.categories[params[:category]],
    })
  response.body
end

post "/checkins/add" do
  content_type :json  
  authenticate!
  response = api(:post, request.path, {
    venueId: params[:venueId], 
    oauth_token: session[:token],
    })
  response.body    
end

post "/tips/add" do
  content_type :json  
  authenticate!
  response = api(:post, request.path, {
    venueId: params[:venueId], 
    oauth_token: session[:token],
    text: params[:text]
    })
  response.body    
end

post "/tips/:id/delete" do
  content_type :json  
  authenticate!
  response = api(:post, "/tips/#{params[:id]}/delete", {
    oauth_token: session[:token]
    })
  response.body    
end

get "/venues/:id/:action" do
  content_type :json
  response = api(:get,request.path)
  response.body
end

post "/venues/:id/like" do
  content_type :json
  authenticate!
  response = api(:post,request.path,{
    set: params[:set],
    oauth_token: session[:token]          
    })
  response.body
end

post "/venues/:id/dislike" do
  content_type :json
  authenticate!
  response = api(:post,request.path,{
    set: params[:set],
    oauth_token: session[:token]
    })
  response.body
end