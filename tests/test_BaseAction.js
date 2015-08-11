import chai from 'chai';
import sinon from 'sinon';
import sinon_chai from 'sinon-chai';
import chai_as_promised from 'chai-as-promised';
import BaseAction from '../lib/BaseAction';

chai.use(sinon_chai);
chai.use(chai_as_promised);
chai.should();

var robot = {
  slack_: {
    openDM: sinon.stub(),
    getChannelGroupOrDMByName: sinon.stub(),
    getDMById: sinon.stub(),
    getDMByName: sinon.stub()
  }
};
var payload = { user: {id: 'x', name: 'x-men'}, channel: { postMessage: sinon.spy() } };

describe('action/BaseAction', () => {
  it('should be able to attach robot instance', function() {
    var action = new BaseAction(robot);
    action.robot_.should.be.deep.equal(robot);
  });

  it('should be able to set message payload', () => {
    var action = new BaseAction(robot);
    action.payload(payload).should.be.equal(action);
    action.messagePayload.should.be.equal(payload);
  });

  it('should be able to reply to channel/group/DM', done => {
    var action = new BaseAction(robot);
    var response = {key: 'value'};

    payload.channel.postMessage.reset();
    action.payload(payload).reply(response).then(() => {
      payload.channel.postMessage.should.be.calledWith({as_user: true, key: 'value'});
      done();
    });
  });

  it('should be able to reply text to channel/group/DM', done => {
    var action = new BaseAction(robot);
    var message = 'some text message';

    payload.channel.postMessage.reset();
    action.payload(payload).replyText(message).then(() => {
      payload.channel.postMessage.should.be.calledWith({as_user: true, text: message});
      done();
    });
  });

  it('should be able to reply via DM', done => {
    var action = new BaseAction(robot);
    var response = {via: 'dm'};

    // reset stub
    robot.slack_.openDM.reset();
    robot.slack_.getDMByName.reset();
    robot.slack_.getDMById.reset();

    // prepare stub
    var dmStub = {postMessage: sinon.stub()};
    robot.slack_.openDM.callsArgWith(1);
    robot.slack_.getDMByName.returns(dmStub);
    robot.slack_.getDMById.returns(dmStub);

    action.payload(payload).replyDM(response).then(() => {
      robot.slack_.openDM.getCall(0).args[0].should.be.equal(payload.user.id);
      dmStub.postMessage.should.be.calledWith({as_user: true, via: 'dm'});
      done();
    });
  });

  it('should be able to reply text via DM', done => {
    var action = new BaseAction(robot);
    var message = 'text via dm';

    // reset stub
    robot.slack_.openDM.reset();
    robot.slack_.getDMByName.reset();
    robot.slack_.getDMById.reset();

    // prepare stub
    var dmStub = {postMessage: sinon.stub()};
    robot.slack_.openDM.callsArgWith(1);
    robot.slack_.getDMByName.returns(dmStub);
    robot.slack_.getDMById.returns(dmStub);

    action.payload(payload).replyTextDM(message).then(() => {
      robot.slack_.openDM.getCall(0).args[0].should.be.equal(payload.user.id);
      dmStub.postMessage.should.be.calledWith({as_user: true, text: 'text via dm'});
      done();
    });
  });


  it('should be able to find the best way to reply via DM', done => {
    var action = new BaseAction(robot);
    var message = 'text via dm';

    // reset stub
    robot.slack_.openDM.reset();
    robot.slack_.getDMByName.reset();
    robot.slack_.getDMById.reset();

    // prepare stub
    var dmStub = {postMessage: sinon.stub()};
    robot.slack_.openDM.callsArgWith(1);
    robot.slack_.getDMByName.returns(dmStub);
    robot.slack_.getDMById.returns(null);

    action.payload(payload).replyTextDM(message).then(() => {
      robot.slack_.openDM.getCall(0).args[0].should.be.equal(payload.user.id);
      dmStub.postMessage.should.be.calledWith({as_user: true, text: 'text via dm'});
      done();
    });
  });

  it('should be reject promise if not able to reply dm', () => {
    var action = new BaseAction(robot);
    var message = 'text via dm';
    var expectedError = 'Cannot get dm instance';

    // reset stub
    robot.slack_.openDM.reset();
    robot.slack_.getDMByName.reset();
    robot.slack_.getDMById.reset();

    // prepare stub
    robot.slack_.openDM.callsArgWith(1);
    robot.slack_.getDMByName.returns(undefined);
    robot.slack_.getDMById.returns(undefined);

    return action.payload(payload).replyTextDM(message).should.be.rejectedWith(expectedError);
  });


  it('should be able to send response to specific channel/group/dm instead of reply', done => {
    var action = new BaseAction(robot);
    var response = {specific: 'channel/group/dm'};

    // reset stub
    robot.slack_.getChannelGroupOrDMByName.reset();

    // prepare stub
    var chatStub = {postMessage: sinon.stub()};
    robot.slack_.getChannelGroupOrDMByName.returns(chatStub);

    action.payload(payload).sendTo('#general', response).then(() => {
      robot.slack_.getChannelGroupOrDMByName.should.be.calledWith('#general');
      chatStub.postMessage.should.be.calledWith({as_user: true, specific: 'channel/group/dm'});
      done();
    });
  });

  it('should be able to send text to specific channel/group/DM', done => {
    var action = new BaseAction(robot);
    var message = 'message for specific channel/group/dm';
    var sendToStub = sinon.stub(BaseAction.prototype, 'sendTo').returns(Promise.resolve());

    action.payload(payload).sendTextTo('#general', message).then(() => {
      sendToStub.should.be.calledWith('#general', {text: message})
      sendToStub.restore();
      done();
    });
  });

  it('should be able to format username for mention', () => {
    var action = new BaseAction(robot);
    action.mentionUser('username').should.be.equal('<@username>')
    action.mentionUser('@username').should.be.equal('<@username>')
  });

  it('should be able to format channel for mention', () => {
    var action = new BaseAction(robot);
    action.mentionChannel('channel-name').should.be.equal('<#channel-name>');
    action.mentionChannel('#channel-name').should.be.equal('<#channel-name>');
  });

});
