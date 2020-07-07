import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { withRouter } from 'react-router-dom';
import { Container } from 'reactstrap';
import { Meteor } from 'meteor/meteor';

class Page extends Component {
    state = {
      data: {
        name: null,
        content: null,
      },
    }

    componentDidMount() {
      const { history } = this.props;

      Meteor.call('getPageByName',
        this.props.match.params.name,
        (error, result) => {
          if (error || result == null) { history.push('/introuvable'); }

          this.setState({
            data: result,
          });
        },
      );
    }

    componentWillReceiveProps(props) {
      const { history } = this.props;

      Meteor.call('getPageByName',
        props.match.params.name,
        (error, result) => {
          if (error || result == null) { history.push('/introuvable'); }

          this.setState({
            data: result,
          });
        },
      );
    }

    render() {
      const { data } = this.state;

      return (
        <Container id="main-content">
          <MetaTags>
            <title>{`${data.name} - Onvataider.com`}</title>
            <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
            <meta property="og:title" content={`${data.name} - Onvataider.com`} />
            <meta property="og:image" content="https://onvataider.com/banner.jpg" />
          </MetaTags>

          <section className="ql-editor" dangerouslySetInnerHTML={{ __html: data.content }} />
        </Container>
      );
    }
}

export default withRouter(Page);
