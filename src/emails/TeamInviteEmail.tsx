import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TeamInviteEmailProps {
  inviterName: string;
  companyName: string;
  inviteLink: string;
  role: string;
}

export function TeamInviteEmail({
  inviterName,
  companyName,
  inviteLink,
  role,
}: TeamInviteEmailProps) {
  const previewText = `${inviterName} invited you to join ${companyName} on Plato`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎊 You've Been Invited!</Heading>
          
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{companyName}</strong> on Plato.
          </Text>

          <Text style={text}>
            You'll be joining as a <strong>{role}</strong> and will have access to:
          </Text>

          <Section style={features}>
            {role === 'OWNER' || role === 'ADMIN' ? (
              <>
                <Text style={feature}>✅ Full access to all recipes and ingredients</Text>
                <Text style={feature}>✅ Manage team members</Text>
                <Text style={feature}>✅ Edit company settings</Text>
                <Text style={feature}>✅ View analytics and reports</Text>
              </>
            ) : role === 'EDITOR' ? (
              <>
                <Text style={feature}>✅ Create and edit recipes</Text>
                <Text style={feature}>✅ Manage ingredients</Text>
                <Text style={feature}>✅ View cost analytics</Text>
              </>
            ) : (
              <>
                <Text style={feature}>✅ View all recipes</Text>
                <Text style={feature}>✅ View ingredients and costs</Text>
                <Text style={feature}>✅ Print recipe cards</Text>
              </>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            This invitation will expire in 7 days. If you didn't expect this invitation, 
            you can safely ignore this email.
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The Plato Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 40px",
};

const features = {
  margin: "16px 40px",
};

const feature = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 40px",
};

