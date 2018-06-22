function myFunction() {
  var email = 'xxxxx'
  var token = 'xxxxx'
  var inEventEmoji = ':date:'
  var inEventMessagePrefix = '' //'カレンダー予定:'とか書く
  var noEventEmoji = ':satisfied:' // 予定が無いか限定公開の場合に表示する emoji
  var noEventMessage = 'わーわー' // 予定が無いか限定公開の場合に表示するメッセージ
  var ima = new Imananishiton(email, token, inEventEmoji, noEventEmoji,inEventMessagePrefix,noEventMessage)
  ima.nanishiton()
}
var Imananishiton = function(email, token, inEventEmoji, noEventEmoji,inEventMessagePrefix,noEventMessage) {
    this.email = email
    this.token = token
    this.inEventEmoji = inEventEmoji
    this.noEventEmoji = noEventEmoji
    this.inEventMessagePrefix = inEventMessagePrefix
    this.noEventMessage = noEventMessage
}

Imananishiton.prototype = {
  nanishiton: function() {
    var events = this.getCurrentEvents()
    var message = this.createStatusMessage(events[0])
    var status = [
      CalendarApp.GuestStatus.OWNER,
      CalendarApp.GuestStatus.YES,
      CalendarApp.GuestStatus.MAYBE,
      CalendarApp.GuestStatus.INVITED
    ]
    var filtered_events = events.filter(function(e) {
      return (status.indexOf(e.getMyStatus()) >= 0)
    })
    if(filtered_events.length == 0){
      this.changeSlackStatus("", "")
    }
    filtered_events.forEach(function(filtered_event){
      var message = this.createStatusMessage(filtered_event)
      var emoji = this.createStatusEmoji(message,filtered_event)
      this.changeSlackStatus(this.inEventMessagePrefix + message, emoji)
    },this)
 },
  getCurrentEvents: function() {
    var start = new Date()
    var end = new Date(start.getTime() + 60 * 1000)
    var calendar = CalendarApp.getCalendarById(this.email)
    var events = calendar.getEvents(start, end)
    return events.sort(this.compareSchedule)
  },
  compareSchedule: function(first, second) {
    if ((first.isAllDayEvent() && second.isAllDayEvent()) || first.getStartTime() === second.getStartTime()) { return 0 }
    if (second.isAllDayEvent()) { return -1 }
    if (first.isAllDayEvent()) { return 1 }
    return first.getStartTime() < second.getStartTime() ? 1 : -1
  },
  createStatusMessage: function(event) {
    if (!event || this.isPrivateEvent(event)) {
      return this.noEventMessage
    }
    var message =  event.getTitle()
    if (event.getLocation() !== '') {
      if (event.getLocation().length > 20) {
        message += ' @ ' + event.getLocation().substr(0, 20) + '...'
      } else {
        message += ' @ ' + event.getLocation()
      }
    }
    if (event.isAllDayEvent()) {
      return message + '【終日】'
    }
    var schedule = this.getEventSchedule(event)
    return message + '【' + schedule['start'] + ' ～ ' + schedule['end'] + '】'
  },
  isPrivateEvent: function(event) {
    return event.getVisibility() !== CalendarApp.Visibility.DEFAULT
  },
  isAlldayEvent:function(event) {
    return event.isAllDayEvent()
  },
  getEventSchedule: function(event) {
    return {
      start: Utilities.formatDate(event.getStartTime(), 'Asia/Tokyo', 'HH:mm'),
      end: Utilities.formatDate(event.getEndTime(), 'Asia/Tokyo', 'HH:mm'),
    }
  },
  createStatusEmoji: function(message,event) {
    if (!event || this.isPrivateEvent(event)|| this.isAlldayEvent(event)) {
      return this.noEventEmoji
    } else {
      if(message.slice(message,3) == "[休]"){
         return ':yasumi:'
      }else{
         return this.inEventEmoji
      }
    }
  },
  changeSlackStatus: function(message, emoji) {
    var profile = {
      'status_text': message,
      'status_emoji': emoji,
    }
    UrlFetchApp.fetch("https://slack.com/api/users.profile.set?token=" + this.token + "&profile=" + encodeURIComponent(JSON.stringify(profile)))
  },
}
