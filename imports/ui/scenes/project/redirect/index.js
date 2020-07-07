import { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';

class RedirectId extends Component {
  componentDidMount() {
    const { history } = this.props;

    Meteor.call('getProjectUrlById', this.props.match.params.projectId, (error, url) => {
      if (error || url == null) { return history.push('/introuvable'); }

      history.push(`/projet/${url}`);
    });
  }

  render() {
    document.title = 'Redirection vers le projet ... - Onvataider.com';
    return (null);
  }
}

export default withRouter(RedirectId);
